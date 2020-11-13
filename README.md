# Lego Technic Gear Ratio Calculator

This is a free online app to find gear sequences for a given transmission ratio.

Features
- Specify a list of available gears
- Exact and approximate search
- Exclude connections that can't be easily built with real parts
- Supply fixed gear sequences at the start and end of the generated sequence
- Visual representation of the generated gear sequence with animations
- If the target ratio contains prime factors that are not present in the avaialbe gears, the app will show solutions that include differential gears.
Otherwise, no exact solution would be possible
- Sequence editor to calculate transmission ratios for user defined gear sequences
- Fit gears tool that shows possible ways to connect a given pair of gears

[Click here to go to the web app](https://marian42.de/gears).

# Local setup and development

You need to have [TypeScript](https://www.typescriptlang.org/) installed.
In the project root, run `tsc`.
This should run without errors and create the file `app.js`.

You need a webserver that locally serves the files from the project directory.
If you have python installed, you can call `python3 -m http.server`.
It will tell you the port, for example 8000, and you can visit http://localhost:8000 in your browser.
Alternatively, you can install [http-server](https://www.npmjs.com/package/http-server), which will also create a server in port 8000.

If you work on the code, run `tsc --watch`, which will recompile everytime you change a source file.
