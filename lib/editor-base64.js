'use strict';

const fs = require('fs');
const path = require('path');

const contentType = {
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

class EditorBase64 {

    constructor(editor) {
        this.editor = editor;
    }

    destroy() {
        this.editor = null;
    }

    base64Encode(filePath, callback) {

        if(!filePath || !fs.existsSync(filePath)) {
            return;
        }
        let file = fs.readFileSync(filePath);
        let extName = path.extname(filePath).slice(1);
        let base64Str = new Buffer(file).toString('base64');
        let mimeType = contentType[extName];
        let data = `data:${mimeType?mimeType:""};base64,${base64Str}`

        callback && callback(data);

    }

    rangeExists(ranges, range) {
        return ranges.some(item => {
            return item.toString() == range.toString();
        });
    }

    pathCompose(text) {

        if(!text || path.isAbsolute(text) || !this.editor.getPath()) {
            return;
        }

        let currentFolder = path.dirname(this.editor.getPath());
        let selectedPath = path.join(currentFolder, text);

        return selectedPath;

    }

    doEncode(callback) {

        if(!this.editor) {
            return;
        }

        let cursors = this.editor.getCursors();
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

            let marker = this.editor.markBufferRange(range);
            let text = this.editor.getTextInBufferRange(range);
            markers.push({marker, text});

        });

        markers.forEach(item => {

            let selectedPath = this.pathCompose(item.text);
            let base64Data = this.base64Encode(selectedPath, data => {

                this.editor.setTextInBufferRange(item.marker.getBufferRange(), data);
                item.marker.destroy();

            });

        });

        callback && callback();

    }

}

exports['default'] = EditorBase64;
module.exports = exports['default'];
