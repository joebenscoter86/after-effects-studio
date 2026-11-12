// Setup for picture eval 22 (review a finished piece you did not build). Run
// it unchanged as the `code` of ae_do { operation: "eval.run" }. It builds
// one comp with a few precomps from the data below and returns the comp and
// its brief. The data is encoded on purpose: this eval tests what a reviewer
// finds by looking at the comp, so do not decode it; review the comp.
// (For maintainers: the data is encodeBuild(reviewBuild()) from scenes.mjs,
// which says what the comp holds; release/tests/picture-evals.test.mjs checks
// that the two agree.)
// Everything goes in a new folder with a unique name; nothing existing is
// changed, removed or rendered, and the render queue is not touched. It
// refuses unless the project is 8 bpc with no working space.
// NOT VERIFIED IN AFTER EFFECTS: an effect property set by index, a mask's
// expansion on a feathered mask, and a comp marker set through markerProperty.
// SCENE-BEGIN
var DATA = "eyJpZCI6InJldmlldy1wbGF0ZSIsInZlcnNpb24iOjEsIndpZHRoIjoxOTIwLCJoZWlnaHQiOjEwODAsImZwcyI6MzAsImZyYW1lcyI6MTgwLCJiZyI6WzAsMCwwXSwiY29tcHMiOlt7ImlkIjoicGxhdGUiLCJuYW1lIjoicGxhdGUiLCJzaXplIjpbMjExMiwxMjcyXSwibGF5ZXJzIjpbeyJuYW1lIjoid2FsbCIsInNvbGlkIjpbMC40NiwwLjQ2LDAuNDZdfSx7Im5hbWUiOiJ3YWxsIGRldGFpbCIsInNvbGlkIjpbMC4zNCwwLjM0LDAuMzRdLCJtYXNrcyI6W3sicG9pbnRzIjpbWzIyLDBdLFsyNiwwXSxbMjYsMTI3Ml0sWzIyLDEyNzJdXX0seyJwb2ludHMiOltbNzAsMF0sWzc0LDBdLFs3NCwxMjcyXSxbNzAsMTI3Ml1dfSx7InBvaW50cyI6W1sxMTgsMF0sWzEyMiwwXSxbMTIyLDEyNzJdLFsxMTgsMTI3Ml1dfSx7InBvaW50cyI6W1sxNjYsMF0sWzE3MCwwXSxbMTcwLDEyNzJdLFsxNjYsMTI3Ml1dfSx7InBvaW50cyI6W1syMTQsMF0sWzIxOCwwXSxbMjE4LDEyNzJdLFsyMTQsMTI3Ml1dfSx7InBvaW50cyI6W1syNjIsMF0sWzI2NiwwXSxbMjY2LDEyNzJdLFsyNjIsMTI3Ml1dfSx7InBvaW50cyI6W1szMTAsMF0sWzMxNCwwXSxbMzE0LDEyNzJdLFszMTAsMTI3Ml1dfSx7InBvaW50cyI6W1szNTgsMF0sWzM2MiwwXSxbMzYyLDEyNzJdLFszNTgsMTI3Ml1dfSx7InBvaW50cyI6W1s0MDYsMF0sWzQxMCwwXSxbNDEwLDEyNzJdLFs0MDYsMTI3Ml1dfSx7InBvaW50cyI6W1s0NTQsMF0sWzQ1OCwwXSxbNDU4LDEyNzJdLFs0NTQsMTI3Ml1dfSx7InBvaW50cyI6W1s1MDIsMF0sWzUwNiwwXSxbNTA2LDEyNzJdLFs1MDIsMTI3Ml1dfSx7InBvaW50cyI6W1s1NTAsMF0sWzU1NCwwXSxbNTU0LDEyNzJdLFs1NTAsMTI3Ml1dfSx7InBvaW50cyI6W1s1OTgsMF0sWzYwMiwwXSxbNjAyLDEyNzJdLFs1OTgsMTI3Ml1dfSx7InBvaW50cyI6W1s2NDYsMF0sWzY1MCwwXSxbNjUwLDEyNzJdLFs2NDYsMTI3Ml1dfSx7InBvaW50cyI6W1s2OTQsMF0sWzY5OCwwXSxbNjk4LDEyNzJdLFs2OTQsMTI3Ml1dfSx7InBvaW50cyI6W1s3NDIsMF0sWzc0NiwwXSxbNzQ2LDEyNzJdLFs3NDIsMTI3Ml1dfSx7InBvaW50cyI6W1s3OTAsMF0sWzc5NCwwXSxbNzk0LDEyNzJdLFs3OTAsMTI3Ml1dfSx7InBvaW50cyI6W1s4MzgsMF0sWzg0MiwwXSxbODQyLDEyNzJdLFs4MzgsMTI3Ml1dfSx7InBvaW50cyI6W1s4ODYsMF0sWzg5MCwwXSxbODkwLDEyNzJdLFs4ODYsMTI3Ml1dfSx7InBvaW50cyI6W1s5MzQsMF0sWzkzOCwwXSxbOTM4LDEyNzJdLFs5MzQsMTI3Ml1dfSx7InBvaW50cyI6W1s5ODIsMF0sWzk4NiwwXSxbOTg2LDEyNzJdLFs5ODIsMTI3Ml1dfSx7InBvaW50cyI6W1sxMDMwLDBdLFsxMDM0LDBdLFsxMDM0LDEyNzJdLFsxMDMwLDEyNzJdXX0seyJwb2ludHMiOltbMTA3OCwwXSxbMTA4MiwwXSxbMTA4MiwxMjcyXSxbMTA3OCwxMjcyXV19LHsicG9pbnRzIjpbWzExMjYsMF0sWzExMzAsMF0sWzExMzAsMTI3Ml0sWzExMjYsMTI3Ml1dfSx7InBvaW50cyI6W1sxMTc0LDBdLFsxMTc4LDBdLFsxMTc4LDEyNzJdLFsxMTc0LDEyNzJdXX0seyJwb2ludHMiOltbMTIyMiwwXSxbMTIyNiwwXSxbMTIyNiwxMjcyXSxbMTIyMiwxMjcyXV19LHsicG9pbnRzIjpbWzEyNzAsMF0sWzEyNzQsMF0sWzEyNzQsMTI3Ml0sWzEyNzAsMTI3Ml1dfSx7InBvaW50cyI6W1sxMzE4LDBdLFsxMzIyLDBdLFsxMzIyLDEyNzJdLFsxMzE4LDEyNzJdXX0seyJwb2ludHMiOltbMTM2NiwwXSxbMTM3MCwwXSxbMTM3MCwxMjcyXSxbMTM2NiwxMjcyXV19LHsicG9pbnRzIjpbWzE0MTQsMF0sWzE0MTgsMF0sWzE0MTgsMTI3Ml0sWzE0MTQsMTI3Ml1dfSx7InBvaW50cyI6W1sxNDYyLDBdLFsxNDY2LDBdLFsxNDY2LDEyNzJdLFsxNDYyLDEyNzJdXX0seyJwb2ludHMiOltbMTUxMCwwXSxbMTUxNCwwXSxbMTUxNCwxMjcyXSxbMTUxMCwxMjcyXV19LHsicG9pbnRzIjpbWzE1NTgsMF0sWzE1NjIsMF0sWzE1NjIsMTI3Ml0sWzE1NTgsMTI3Ml1dfSx7InBvaW50cyI6W1sxNjA2LDBdLFsxNjEwLDBdLFsxNjEwLDEyNzJdLFsxNjA2LDEyNzJdXX0seyJwb2ludHMiOltbMTY1NCwwXSxbMTY1OCwwXSxbMTY1OCwxMjcyXSxbMTY1NCwxMjcyXV19LHsicG9pbnRzIjpbWzE3MDIsMF0sWzE3MDYsMF0sWzE3MDYsMTI3Ml0sWzE3MDIsMTI3Ml1dfSx7InBvaW50cyI6W1sxNzUwLDBdLFsxNzU0LDBdLFsxNzU0LDEyNzJdLFsxNzUwLDEyNzJdXX0seyJwb2ludHMiOltbMTc5OCwwXSxbMTgwMiwwXSxbMTgwMiwxMjcyXSxbMTc5OCwxMjcyXV19LHsicG9pbnRzIjpbWzE4NDYsMF0sWzE4NTAsMF0sWzE4NTAsMTI3Ml0sWzE4NDYsMTI3Ml1dfSx7InBvaW50cyI6W1sxODk0LDBdLFsxODk4LDBdLFsxODk4LDEyNzJdLFsxODk0LDEyNzJdXX0seyJwb2ludHMiOltbMTk0MiwwXSxbMTk0NiwwXSxbMTk0NiwxMjcyXSxbMTk0MiwxMjcyXV19LHsicG9pbnRzIjpbWzE5OTAsMF0sWzE5OTQsMF0sWzE5OTQsMTI3Ml0sWzE5OTAsMTI3Ml1dfSx7InBvaW50cyI6W1syMDM4LDBdLFsyMDQyLDBdLFsyMDQyLDEyNzJdLFsyMDM4LDEyNzJdXX0seyJwb2ludHMiOltbMjA4NiwwXSxbMjA5MCwwXSxbMjA5MCwxMjcyXSxbMjA4NiwxMjcyXV19LHsicG9pbnRzIjpbWzAsMjJdLFsyMTEyLDIyXSxbMjExMiwyNl0sWzAsMjZdXX0seyJwb2ludHMiOltbMCw3MF0sWzIxMTIsNzBdLFsyMTEyLDc0XSxbMCw3NF1dfSx7InBvaW50cyI6W1swLDExOF0sWzIxMTIsMTE4XSxbMjExMiwxMjJdLFswLDEyMl1dfSx7InBvaW50cyI6W1swLDE2Nl0sWzIxMTIsMTY2XSxbMjExMiwxNzBdLFswLDE3MF1dfSx7InBvaW50cyI6W1swLDIxNF0sWzIxMTIsMjE0XSxbMjExMiwyMThdLFswLDIxOF1dfSx7InBvaW50cyI6W1swLDI2Ml0sWzIxMTIsMjYyXSxbMjExMiwyNjZdLFswLDI2Nl1dfSx7InBvaW50cyI6W1swLDMxMF0sWzIxMTIsMzEwXSxbMjExMiwzMTRdLFswLDMxNF1dfSx7InBvaW50cyI6W1swLDM1OF0sWzIxMTIsMzU4XSxbMjExMiwzNjJdLFswLDM2Ml1dfSx7InBvaW50cyI6W1swLDQwNl0sWzIxMTIsNDA2XSxbMjExMiw0MTBdLFswLDQxMF1dfSx7InBvaW50cyI6W1swLDQ1NF0sWzIxMTIsNDU0XSxbMjExMiw0NThdLFswLDQ1OF1dfSx7InBvaW50cyI6W1swLDUwMl0sWzIxMTIsNTAyXSxbMjExMiw1MDZdLFswLDUwNl1dfSx7InBvaW50cyI6W1swLDU1MF0sWzIxMTIsNTUwXSxbMjExMiw1NTRdLFswLDU1NF1dfSx7InBvaW50cyI6W1swLDU5OF0sWzIxMTIsNTk4XSxbMjExMiw2MDJdLFswLDYwMl1dfSx7InBvaW50cyI6W1swLDY0Nl0sWzIxMTIsNjQ2XSxbMjExMiw2NTBdLFswLDY1MF1dfSx7InBvaW50cyI6W1swLDY5NF0sWzIxMTIsNjk0XSxbMjExMiw2OThdLFswLDY5OF1dfSx7InBvaW50cyI6W1swLDc0Ml0sWzIxMTIsNzQyXSxbMjExMiw3NDZdLFswLDc0Nl1dfSx7InBvaW50cyI6W1swLDc5MF0sWzIxMTIsNzkwXSxbMjExMiw3OTRdLFswLDc5NF1dfSx7InBvaW50cyI6W1swLDgzOF0sWzIxMTIsODM4XSxbMjExMiw4NDJdLFswLDg0Ml1dfSx7InBvaW50cyI6W1swLDg4Nl0sWzIxMTIsODg2XSxbMjExMiw4OTBdLFswLDg5MF1dfSx7InBvaW50cyI6W1swLDkzNF0sWzIxMTIsOTM0XSxbMjExMiw5MzhdLFswLDkzOF1dfSx7InBvaW50cyI6W1swLDk4Ml0sWzIxMTIsOTgyXSxbMjExMiw5ODZdLFswLDk4Nl1dfSx7InBvaW50cyI6W1swLDEwMzBdLFsyMTEyLDEwMzBdLFsyMTEyLDEwMzRdLFswLDEwMzRdXX0seyJwb2ludHMiOltbMCwxMDc4XSxbMjExMiwxMDc4XSxbMjExMiwxMDgyXSxbMCwxMDgyXV19LHsicG9pbnRzIjpbWzAsMTEyNl0sWzIxMTIsMTEyNl0sWzIxMTIsMTEzMF0sWzAsMTEzMF1dfSx7InBvaW50cyI6W1swLDExNzRdLFsyMTEyLDExNzRdLFsyMTEyLDExNzhdLFswLDExNzhdXX0seyJwb2ludHMiOltbMCwxMjIyXSxbMjExMiwxMjIyXSxbMjExMiwxMjI2XSxbMCwxMjI2XV19XX1dfSx7ImlkIjoidGFrZTEiLCJuYW1lIjoidGFrZSAxIiwic2l6ZSI6WzE5MjAsMTA4MF0sImxheWVycyI6W3sibmFtZSI6InByZXNlbnRlciAwIiwic29saWQiOlswLjkyLDAuOTIsMC45XSwibWFza3MiOlt7InBvaW50cyI6W1s3ODAsODYwXSxbMTE0MCw4NjBdLFsxMTUwLDExMDBdLFs3NzAsMTEwMF1dLCJmZWF0aGVyIjoxLCJncm93Ijo0fSx7InBvaW50cyI6W1s3NjAsNTYwXSxbMTE2MCw1NjBdLFsxMTgwLDg4MF0sWzc0MCw4ODBdXSwiZmVhdGhlciI6MSwiZ3JvdyI6NH0seyJwb2ludHMiOltbOTI1LDUwMF0sWzk5NSw1MDBdLFs5OTUsNTgwXSxbOTI1LDU4MF1dLCJmZWF0aGVyIjoxLCJncm93Ijo0fSx7InBvaW50cyI6W1sxMDY1LDQxMF0sWzEwNjQuMSw0MjYuOTddLFsxMDYxLjQyLDQ0My42NV0sWzEwNTcuMDEsNDU5Ljc1XSxbMTA1MC45Myw0NzVdLFsxMDQzLjMsNDg5LjE0XSxbMTAzNC4yNSw1MDEuOTJdLFsxMDIzLjkyLDUxMy4xNF0sWzEwMTIuNSw1MjIuNThdLFsxMDAwLjE4LDUzMC4xXSxbOTg3LjE4LDUzNS41N10sWzk3My43MSw1MzguODldLFs5NjAsNTQwXSxbOTQ2LjI5LDUzOC44OV0sWzkzMi44Miw1MzUuNTddLFs5MTkuODIsNTMwLjFdLFs5MDcuNSw1MjIuNThdLFs4OTYuMDgsNTEzLjE0XSxbODg1Ljc1LDUwMS45Ml0sWzg3Ni43LDQ4OS4xNF0sWzg2OS4wNyw0NzVdLFs4NjIuOTksNDU5Ljc1XSxbODU4LjU4LDQ0My42NV0sWzg1NS45LDQyNi45N10sWzg1NSw0MTBdLFs4NTUuOSwzOTMuMDNdLFs4NTguNTgsMzc2LjM1XSxbODYyLjk5LDM2MC4yNV0sWzg2OS4wNywzNDVdLFs4NzYuNywzMzAuODZdLFs4ODUuNzUsMzE4LjA4XSxbODk2LjA4LDMwNi44Nl0sWzkwNy41LDI5Ny40Ml0sWzkxOS44MiwyODkuOV0sWzkzMi44MiwyODQuNDNdLFs5NDYuMjksMjgxLjExXSxbOTYwLDI4MF0sWzk3My43MSwyODEuMTFdLFs5ODcuMTgsMjg0LjQzXSxbMTAwMC4xOCwyODkuOV0sWzEwMTIuNSwyOTcuNDJdLFsxMDIzLjkyLDMwNi44Nl0sWzEwMzQuMjUsMzE4LjA4XSxbMTA0My4zLDMzMC44Nl0sWzEwNTAuOTMsMzQ1XSxbMTA1Ny4wMSwzNjAuMjVdLFsxMDYxLjQyLDM3Ni4zNV0sWzEwNjQuMSwzOTMuMDNdXSwiZmVhdGhlciI6MSwiZ3JvdyI6NH1dfSx7Im5hbWUiOiJwcmVzZW50ZXIgMSIsInNvbGlkIjpbMC4xMiwwLjEyLDAuMTNdLCJtYXNrcyI6W3sicG9pbnRzIjpbWzc4MCw4NjBdLFsxMTQwLDg2MF0sWzExNTAsMTEwMF0sWzc3MCwxMTAwXV0sImZlYXRoZXIiOjF9XX0seyJuYW1lIjoicHJlc2VudGVyIDIiLCJzb2xpZCI6WzAuNjIsMC42MiwwLjYyXSwibWFza3MiOlt7InBvaW50cyI6W1s3NjAsNTYwXSxbMTE2MCw1NjBdLFsxMTgwLDg4MF0sWzc0MCw4ODBdXSwiZmVhdGhlciI6MX1dfSx7Im5hbWUiOiJwcmVzZW50ZXIgMyIsInNvbGlkIjpbMC42NywwLjQ2LDAuNF0sIm1hc2tzIjpbeyJwb2ludHMiOltbOTI1LDUwMF0sWzk5NSw1MDBdLFs5OTUsNTgwXSxbOTI1LDU4MF1dLCJmZWF0aGVyIjoxfV19LHsibmFtZSI6InByZXNlbnRlciA0Iiwic29saWQiOlswLjY3LDAuNDYsMC40XSwibWFza3MiOlt7InBvaW50cyI6W1sxMDY1LDQxMF0sWzEwNjQuMSw0MjYuOTddLFsxMDYxLjQyLDQ0My42NV0sWzEwNTcuMDEsNDU5Ljc1XSxbMTA1MC45Myw0NzVdLFsxMDQzLjMsNDg5LjE0XSxbMTAzNC4yNSw1MDEuOTJdLFsxMDIzLjkyLDUxMy4xNF0sWzEwMTIuNSw1MjIuNThdLFsxMDAwLjE4LDUzMC4xXSxbOTg3LjE4LDUzNS41N10sWzk3My43MSw1MzguODldLFs5NjAsNTQwXSxbOTQ2LjI5LDUzOC44OV0sWzkzMi44Miw1MzUuNTddLFs5MTkuODIsNTMwLjFdLFs5MDcuNSw1MjIuNThdLFs4OTYuMDgsNTEzLjE0XSxbODg1Ljc1LDUwMS45Ml0sWzg3Ni43LDQ4OS4xNF0sWzg2OS4wNyw0NzVdLFs4NjIuOTksNDU5Ljc1XSxbODU4LjU4LDQ0My42NV0sWzg1NS45LDQyNi45N10sWzg1NSw0MTBdLFs4NTUuOSwzOTMuMDNdLFs4NTguNTgsMzc2LjM1XSxbODYyLjk5LDM2MC4yNV0sWzg2OS4wNywzNDVdLFs4NzYuNywzMzAuODZdLFs4ODUuNzUsMzE4LjA4XSxbODk2LjA4LDMwNi44Nl0sWzkwNy41LDI5Ny40Ml0sWzkxOS44MiwyODkuOV0sWzkzMi44MiwyODQuNDNdLFs5NDYuMjksMjgxLjExXSxbOTYwLDI4MF0sWzk3My43MSwyODEuMTFdLFs5ODcuMTgsMjg0LjQzXSxbMTAwMC4xOCwyODkuOV0sWzEwMTIuNSwyOTcuNDJdLFsxMDIzLjkyLDMwNi44Nl0sWzEwMzQuMjUsMzE4LjA4XSxbMTA0My4zLDMzMC44Nl0sWzEwNTAuOTMsMzQ1XSxbMTA1Ny4wMSwzNjAuMjVdLFsxMDYxLjQyLDM3Ni4zNV0sWzEwNjQuMSwzOTMuMDNdXSwiZmVhdGhlciI6MX1dfV19LHsiaWQiOiJ0YWtlMiIsIm5hbWUiOiJ0YWtlIDIiLCJzaXplIjpbMTkyMCwxMDgwXSwibGF5ZXJzIjpbeyJuYW1lIjoicHJlc2VudGVyIDEiLCJzb2xpZCI6WzAuMTM2OCwwLjEwNTYsMC4xNDU2XSwibWFza3MiOlt7InBvaW50cyI6W1s3ODAsODYwXSxbMTE0MCw4NjBdLFsxMTUwLDExMDBdLFs3NzAsMTEwMF1dLCJmZWF0aGVyIjoxfV19LHsibmFtZSI6InByZXNlbnRlciAyIiwic29saWQiOlswLjcwNjgsMC41NDU2LDAuNjk0NF0sIm1hc2tzIjpbeyJwb2ludHMiOltbNzYwLDU2MF0sWzExNjAsNTYwXSxbMTE4MCw4ODBdLFs3NDAsODgwXV0sImZlYXRoZXIiOjF9XX0seyJuYW1lIjoicHJlc2VudGVyIDMiLCJzb2xpZCI6WzAuNzYzOCwwLjQwNDgsMC40NDhdLCJtYXNrcyI6W3sicG9pbnRzIjpbWzkyNSw1MDBdLFs5OTUsNTAwXSxbOTk1LDU4MF0sWzkyNSw1ODBdXSwiZmVhdGhlciI6MX1dfSx7Im5hbWUiOiJwcmVzZW50ZXIgNCIsInNvbGlkIjpbMC43NjM4LDAuNDA0OCwwLjQ0OF0sIm1hc2tzIjpbeyJwb2ludHMiOltbMTA2NSw0MTBdLFsxMDY0LjEsNDI2Ljk3XSxbMTA2MS40Miw0NDMuNjVdLFsxMDU3LjAxLDQ1OS43NV0sWzEwNTAuOTMsNDc1XSxbMTA0My4zLDQ4OS4xNF0sWzEwMzQuMjUsNTAxLjkyXSxbMTAyMy45Miw1MTMuMTRdLFsxMDEyLjUsNTIyLjU4XSxbMTAwMC4xOCw1MzAuMV0sWzk4Ny4xOCw1MzUuNTddLFs5NzMuNzEsNTM4Ljg5XSxbOTYwLDU0MF0sWzk0Ni4yOSw1MzguODldLFs5MzIuODIsNTM1LjU3XSxbOTE5LjgyLDUzMC4xXSxbOTA3LjUsNTIyLjU4XSxbODk2LjA4LDUxMy4xNF0sWzg4NS43NSw1MDEuOTJdLFs4NzYuNyw0ODkuMTRdLFs4NjkuMDcsNDc1XSxbODYyLjk5LDQ1OS43NV0sWzg1OC41OCw0NDMuNjVdLFs4NTUuOSw0MjYuOTddLFs4NTUsNDEwXSxbODU1LjksMzkzLjAzXSxbODU4LjU4LDM3Ni4zNV0sWzg2Mi45OSwzNjAuMjVdLFs4NjkuMDcsMzQ1XSxbODc2LjcsMzMwLjg2XSxbODg1Ljc1LDMxOC4wOF0sWzg5Ni4wOCwzMDYuODZdLFs5MDcuNSwyOTcuNDJdLFs5MTkuODIsMjg5LjldLFs5MzIuODIsMjg0LjQzXSxbOTQ2LjI5LDI4MS4xMV0sWzk2MCwyODBdLFs5NzMuNzEsMjgxLjExXSxbOTg3LjE4LDI4NC40M10sWzEwMDAuMTgsMjg5LjldLFsxMDEyLjUsMjk3LjQyXSxbMTAyMy45MiwzMDYuODZdLFsxMDM0LjI1LDMxOC4wOF0sWzEwNDMuMywzMzAuODZdLFsxMDUwLjkzLDM0NV0sWzEwNTcuMDEsMzYwLjI1XSxbMTA2MS40MiwzNzYuMzVdLFsxMDY0LjEsMzkzLjAzXV0sImZlYXRoZXIiOjF9XX1dfSx7ImlkIjoibWFpbiIsIm5hbWUiOiJyZXZpZXciLCJzaXplIjpbMTkyMCwxMDgwXSwibWFpbiI6dHJ1ZSwibWFya2VycyI6W3siZnJhbWUiOjYwLCJuYW1lIjoiaGl0IiwiY29tbWVudCI6ImhpdCJ9XSwibGF5ZXJzIjpbeyJuYW1lIjoicGxhdGUiLCJjb21wIjoicGxhdGUifSx7Im5hbWUiOiJwbGF0ZSIsImNvbXAiOiJwbGF0ZSIsInNwYW4iOlsxMjAsMTQ5XSwiZWZmZWN0cyI6W3sibWF0Y2hOYW1lIjoiQURCRSBHYXVzc2lhbiBCbHVyIDIiLCJzZXQiOltbMSwzMF1dfV19LHsibmFtZSI6InRha2UgMSIsImNvbXAiOiJ0YWtlMSIsInNwYW4iOlswLDg5XSwiYW5jaG9yIjpbOTYwLDU0MF0sInNjYWxlIjoxMDAsInBvc2l0aW9uIjpbWzAsWzkwMCw1NDBdXSxbODksWzEwMjAsNTQwXV1dfSx7Im5hbWUiOiJ0YWtlIDIiLCJjb21wIjoidGFrZTIiLCJzcGFuIjpbOTAsMTc5XSwiYW5jaG9yIjpbOTYwLDEwODBdLCJzY2FsZSI6MTI1LCJwb3NpdGlvbiI6W1s5MCxbMTAwMCwxMDgwXV0sWzE3OSxbMTEyMCwxMDgwXV1dfSx7Im5hbWUiOiJiYWRnZSIsInNvbGlkIjpbMC45NSwwLjUsMC4xNV0sInNpemUiOlszNjAsMTQwXSwic3BhbiI6WzQ1LDg5XSwicG9zaXRpb24iOltbNDUsWzE1MDAsLTEyMF1dLFs2OCxbMTUwMCwyMjBdXV19XX1dfQ==";
// SCENE-END
var BRIEF = "A 6-second 1920x1080 teaser at 30 fps. A presenter, keyed, composited over a studio wall plate; it must read as one shot filmed in that room. Two takes: take 1 from 0 to 3.0 s, then a cut to take 2 (closer) at 3.0 s, held to 6.0 s. The orange badge (a stand-in for the price tag) drops in from the top and must land on the beat at the comp marker \"hit\", 2.0 s. No on-screen copy.";
var proj = app.project;
if (!proj) throw new Error("No project is open.");
if (proj.bitsPerChannel !== 8) throw new Error("The review eval needs an 8 bpc project; this one is " + proj.bitsPerChannel + " bpc. Nothing was built.");
var ws = String(proj.workingSpace === undefined ? "None" : proj.workingSpace);
if (ws !== "None" && ws !== "") throw new Error("The review eval needs a project with no working space; this one uses '" + ws + "'. Nothing was built.");

function decode(s) {
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", out = [], bits = 0, n = 0;
    for (var i = 0; i < s.length; i++) {
        var c = A.indexOf(s.charAt(i));
        if (c < 0) continue;
        bits = ((bits << 6) | c) & 0xFFFFFF;
        n += 6;
        if (n >= 8) { n -= 8; out.push(String.fromCharCode((bits >> n) & 255)); }
    }
    return out.join("");
}
var S = eval("(" + decode(DATA) + ")");
var FD = 1 / S.fps, DUR = S.frames / S.fps;
var MARK = "comp-room picture eval: " + S.id + " v" + S.version;
var stamp = String(new Date().getTime());
var folder = proj.items.addFolder("Comp Room eval review " + stamp);
folder.comment = MARK;

function addMask(layer, spec) {
    var m = layer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    var shape = new Shape(); shape.vertices = spec.points; shape.closed = true;
    m.property("ADBE Mask Shape").setValue(shape);
    m.maskMode = MaskMode.ADD;
    if (spec.feather) m.property("ADBE Mask Feather").setValue([spec.feather, spec.feather]);
    if (spec.grow) m.property("ADBE Mask Offset").setValue(spec.grow);
}

function setPosition(prop, value) {
    if (typeof value[0] === "number") { prop.setValue(value); return; }
    for (var i = 0; i < value.length; i++) prop.setValueAtTime(value[i][0] * FD, value[i][1]);
    for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
}

var made = {}, main = null;
for (var ci = 0; ci < S.comps.length; ci++) {
    var cs = S.comps[ci];
    var comp = proj.items.addComp("Comp Room eval " + cs.name + " " + stamp, cs.size[0], cs.size[1], 1, DUR, S.fps);
    comp.parentFolder = folder; comp.comment = MARK; comp.bgColor = S.bg;
    for (var li = 0; li < cs.layers.length; li++) {
        var ls = cs.layers[li], layer;
        if (ls.comp) {
            layer = comp.layers.add(made[ls.comp]);
        } else {
            var size = ls.size || cs.size;
            layer = comp.layers.addSolid(ls.solid, ls.name, size[0], size[1], 1, DUR);
            layer.source.parentFolder = folder;
        }
        layer.name = ls.name; layer.comment = MARK;
        var tr = layer.property("ADBE Transform Group");
        if (ls.anchor) tr.property("ADBE Anchor Point").setValue(ls.anchor);
        if (ls.scale) tr.property("ADBE Scale").setValue([ls.scale, ls.scale]);
        if (ls.position) setPosition(tr.property("ADBE Position"), ls.position);
        var masks = ls.masks || [];
        for (var mi = 0; mi < masks.length; mi++) addMask(layer, masks[mi]);
        var effects = ls.effects || [];
        for (var ei = 0; ei < effects.length; ei++) {
            var fx = layer.property("ADBE Effect Parade").addProperty(effects[ei].matchName);
            for (var si = 0; si < effects[ei].set.length; si++) fx.property(effects[ei].set[si][0]).setValue(effects[ei].set[si][1]);
        }
        if (ls.span) { layer.inPoint = ls.span[0] * FD; layer.outPoint = (ls.span[1] + 1) * FD; }
    }
    if (cs.markers) {
        for (var k = 0; k < cs.markers.length; k++) {
            var mv = new MarkerValue(cs.markers[k].name);
            mv.comment = cs.markers[k].comment;
            comp.markerProperty.setValueAtTime(cs.markers[k].frame * FD, mv);
        }
    }
    comp.workAreaStart = 0;
    comp.workAreaDuration = DUR;
    made[cs.id] = comp;
    if (cs.main) main = comp;
}
return {
    ok: true,
    scene: S.id + " v" + S.version,
    folder: folder.name,
    reviewComp: { id: main.id, name: main.name },
    brief: BRIEF,
    note: "Review this comp from its frames against the brief; write your findings to the file the grader's plan names."
};
