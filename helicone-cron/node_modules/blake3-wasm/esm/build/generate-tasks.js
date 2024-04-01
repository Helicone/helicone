var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { writeFileSync } from 'fs.js';
import { dump } from 'js-yaml.js';
import fetch from 'node-fetch.js';
import { join } from 'path.js';
const minVersion = 64;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch('https://nodejs.org/dist/index.json');
    if (!res.ok) {
        throw new Error(`${res.status} error from Node.js releases page`);
    }
    const releases = yield res.json();
    const buildVersion = new Map();
    const versionMap = {};
    for (const release of releases) {
        const moduleVersion = Number(release.modules);
        if (!moduleVersion || moduleVersion < minVersion) {
            break;
        }
        versionMap[release.version] = Number(moduleVersion);
        if (buildVersion.has(moduleVersion)) {
            continue;
        }
        buildVersion.set(moduleVersion, release.version);
    }
    const buildYaml = {
        name: 'Generate Binaries',
        on: {
            push: {
                branches: ['generate-binary'],
            },
        },
        jobs: {
            build: {
                name: 'Build',
                'runs-on': '${{ matrix.os }}',
                strategy: {
                    matrix: { os: ['macos-latest', 'ubuntu-latest', 'windows-latest'] },
                },
                steps: [
                    { uses: 'actions/checkout@master' },
                    { run: 'mkdir dist' },
                    {
                        uses: 'actions-rs/toolchain@v1',
                        with: { target: 'wasm32-unknown-unknown', toolchain: 'nightly' },
                    },
                    ...[...buildVersion.entries()]
                        .map(([moduleVersion, nodeVersion], i) => [
                        { uses: 'actions/setup-node@v1', with: { 'node-version': nodeVersion } },
                        {
                            // See: https://github.com/actions/setup-node/issues/68
                            shell: 'powershell',
                            name: 'patch node-gyp for VS 2019',
                            run: 'npm install --global node-gyp@latest\r\nnpm prefix -g | % {npm config set node_gyp "$_\\node_modules\\node-gyp\\bin\\node-gyp.js"}',
                            if: "matrix.os == 'windows-latest'",
                        },
                        i === 0
                            ? { run: 'npm install neon-cli rimraf' }
                            : { run: './node_modules/.bin/rimraf rs/native/target' },
                        { run: '../node_modules/.bin/neon build --release', 'working-directory': 'rs' },
                        { run: `mv rs/native/index.node dist/\${{ matrix.os }}-${moduleVersion}.node` },
                    ])
                        .reduce((acc, v) => [...acc, ...v], []),
                    {
                        uses: 'actions/upload-artifact@v1',
                        with: { name: 'dist', path: 'dist' },
                    },
                ],
            },
        },
    };
    writeFileSync(join(__dirname, '..', '..', '.github', 'workflows', 'build-neon.yml'), dump(buildYaml));
    writeFileSync(join(__dirname, '..', '..', 'targets.json'), JSON.stringify(versionMap));
}))();
//# sourceMappingURL=generate-tasks.js.map