# RepTracking

RepTracking is a mobile-first workout set and rest timer. It helps lifters log
sets quickly, track training volume, and stay consistent with configurable rest
breaks.

The current version is a dependency-free web prototype that runs locally in any
modern browser. The project is designed to be packaged for iOS and Android
after the core workout experience is validated.

## Features

- Log exercise name, reps, and weight for every set
- Automatically start a rest timer after logging a set
- Configure rest periods in minutes and seconds
- Select common rest presets with one tap
- Pause, resume, skip, and reset the timer
- View total sets, training volume, total planned rest, and set history
- Preserve the current session in browser local storage
- Use a responsive interface built for mobile and desktop testing

## Run Locally

No dependencies or build step are required.

1. Clone the repository:

   ```bash
   git clone https://github.com/RepTracking/RepTracking.git
   cd RepTracking
   ```

2. Open `index.html` in a modern browser.

For a local HTTP server, use any static file server, for example:

```bash
npx serve .
```

## Project Structure

```text
.
|-- index.html             # Application markup
|-- styles.css             # Responsive interface styles
|-- app.js                 # Timer, set tracking, and persistence logic
|-- manifest.webmanifest   # Progressive web app metadata
`-- .github/               # Issue and pull request templates
```

## Roadmap

- Add exercises and reusable workout routines
- Add editing and deletion for individual logged sets
- Add workout history and progress charts
- Improve accessibility and automated test coverage
- Package for iOS and Android
- Add optional cloud sync

See the [issue tracker](https://github.com/RepTracking/RepTracking/issues) for
planned work and community proposals.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before
opening an issue or pull request. By participating, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report security concerns according to [SECURITY.md](SECURITY.md).

## License

RepTracking is open source under the [MIT License](LICENSE).
