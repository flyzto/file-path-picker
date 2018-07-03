'use strict';

const { CompositeDisposable } = require('atom');
const remote = require('remote');

const fs = require('fs');
const path = require('path');

exports['default'] = {

    contentType: null,
    subscriptions: null,

    activate(state) {
        this.contentType = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "gif": "image/gif",
            "svg": "image/svg+xml",
            "ico": "image/x-icon",
            "webp": "image/webp",
            "ttf": "application/x-font-ttf",
            "css": "text/css",
            "html": "text/html",
            "js": "application/x-javascript"
        };
        this.subscriptions = new CompositeDisposable();
        this.registerCommands();
    },

    deactivate() {
        this.contentType = null;
        return this.subscriptions.dispose();
    },

    registerCommands() {
        return this.subscriptions.add(atom.commands.add('atom-text-editor', {
            'file-path-picker:pick-file': () => {
                return this.pickFile();
            },
            'file-path-picker:to-base64': () => {
                return this.toBase64();
            }
        }));
    },

    getCurrentPath() {
        if(!atom.workspace.getActiveTextEditor()) {
            return;
        }
        return atom.workspace.getActiveTextEditor().getPath();
    },

    pickFile() {

        let currentPath = this.getCurrentPath();
        if(!currentPath) {
            return;
        }

        let files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {properties: ['openFile']});
        if(files && files.length) {
            let relativePath = path.relative(path.dirname(currentPath), files[0]);
            relativePath = encodeURI(relativePath.replace(/\\/g, '/'));
            return atom.workspace.getActiveTextEditor().insertText(relativePath);
        }

    },

    base64Encode(filePath) {

        if(!filePath || !fs.existsSync(filePath)) {
            return;
        }
        let file = fs.readFileSync(filePath);
        let extName = path.extname(filePath).slice(1);
        let base64Str = new Buffer(file).toString('base64');
        return `data:${this.contentType[extName]};base64,${base64Str}`;

    },

    rangeExists(ranges, range) {
        return ranges.some(item => {
            return item.toString() == range.toString();
        });
    },

    pathCompose(text) {

        if(!text || path.isAbsolute(text)) {
            return;
        }

        let currentFolder = path.dirname(this.getCurrentPath());
        let selectedPath = path.join(currentFolder, text);

        return selectedPath;

    },

    toBase64() {

        let currentTextEditor = atom.workspace.getActiveTextEditor()
        let cursors = currentTextEditor.getCursors();
        let wordRegex = /(?=[\(\)"'\s])/;

        let ranges = [];

        cursors.forEach(cursor => {

            let rangeStart = cursor.getBeginningOfCurrentWordBufferPosition({wordRegex});
            let rangeEnd = cursor.getEndOfCurrentWordBufferPosition({wordRegex});
            rangeStart.column += 1;

            let range = [rangeStart, rangeEnd];

            if(!this.rangeExists(ranges, range)) {
                ranges.push(range);
            }

        });

        let markers = [];

        ranges.forEach(range => {

            let marker = currentTextEditor.markBufferRange(range);
            let text = currentTextEditor.getTextInBufferRange(range);
            markers.push({marker, text});

        });

        markers.forEach(item => {

            let selectedPath = this.pathCompose(item.text);
            let base64Data = this.base64Encode(selectedPath)
            if(!base64Data) {
                return item.marker.destroy();
            }

            currentTextEditor.setTextInBufferRange(item.marker.getBufferRange(), base64Data);

            return item.marker.destroy();

        });

        cursors = null;
        ranges = null;
        markers = null;

    }
};

module.exports = exports['default'];
