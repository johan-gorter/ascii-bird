# ASCII BIRD

Ascii bird is inspired by "flappy bird" built using simple technologies.
It is meant to be a platform that you can easily use "Vibe code" to add new features (obstacles, gameplay etc).

you can run the game using: `npx http-server -c-1 public`

# "AB Architecture"
The architecture is somewhat particular, optimized for AI and vibe coding.
AB stands for "Abstractionless Bus" (and also "ASCII Bird"). The idea behind it is:
- Very modularized, interconnected using bus(es), so AI can keep its context small.
- No abstraction layers, because AI knows the real low-level API's best.

## Error handling
To make vibe coding easier we continue on most errors. Just log the error to the console.
When we add unit-testing, the test runner will monitor console errors and fail the test.