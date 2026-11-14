// ocr <image> [<image>...]
// Recognises text in each image with Apple's Vision framework and prints one
// JSON line per image, in input order:
//   {"file": "<path as given>", "boxes": [{"t","c","x","y","w","h"}]}
// x, y are the box's top-left corner as shares of the frame from the top left.
// An unreadable image prints {"file": ..., "error": "..."} and the run goes on.
// Images are recognised concurrently; output order is kept.
import Foundation
import Vision
import ImageIO

func r4(_ v: Double) -> Double { (v * 10000).rounded() / 10000 }

func recognise(_ path: String) -> [String: Any] {
  let url = URL(fileURLWithPath: path)
  guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
        let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else {
    return ["file": path, "error": "could not load image"]
  }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = false
  do {
    try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  } catch {
    return ["file": path, "error": "recognition failed: \(error.localizedDescription)"]
  }
  var boxes: [[String: Any]] = []
  for o in req.results ?? [] {
    guard let c = o.topCandidates(1).first else { continue }
    let b = o.boundingBox  // normalised, bottom-left origin
    boxes.append([
      "t": c.string, "c": r4(Double(c.confidence)),
      "x": r4(Double(b.minX)), "y": r4(Double(1 - b.maxY)),
      "w": r4(Double(b.width)), "h": r4(Double(b.height)),
    ])
  }
  return ["file": path, "boxes": boxes]
}

func line(_ obj: [String: Any]) -> String {
  guard let d = try? JSONSerialization.data(withJSONObject: obj, options: [.withoutEscapingSlashes]),
        let s = String(data: d, encoding: .utf8) else {
    return "{\"file\":\"?\",\"error\":\"could not encode result\"}"
  }
  return s
}

let paths = Array(CommandLine.arguments.dropFirst())
if paths.isEmpty {
  FileHandle.standardError.write("usage: ocr <image> [<image>...]\n".data(using: .utf8)!)
  exit(2)
}

// Workers fill slots under a lock; print once all are done.
final class Results: @unchecked Sendable {
  private var lines: [String]
  private let lock = NSLock()
  init(_ n: Int) { lines = Array(repeating: "", count: n) }
  func set(_ i: Int, _ s: String) { lock.lock(); lines[i] = s; lock.unlock() }
  func all() -> [String] { lock.lock(); defer { lock.unlock() }; return lines }
}
let results = Results(paths.count)
// Cap parallelism: each 4K frame decodes to ~33 MB and Vision itself uses several threads.
let width = max(1, min(4, ProcessInfo.processInfo.activeProcessorCount / 2))
let gate = DispatchSemaphore(value: width)
let group = DispatchGroup()
let queue = DispatchQueue(label: "ocr", attributes: .concurrent)
for (i, p) in paths.enumerated() {
  gate.wait()
  group.enter()
  queue.async {
    let s = autoreleasepool { line(recognise(p)) }
    results.set(i, s)
    gate.signal()
    group.leave()
  }
}
group.wait()
for s in results.all() { print(s) }
