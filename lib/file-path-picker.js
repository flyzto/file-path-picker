'use strict';

const { CompositeDisposable } = require('atom');
const remote = require('remote');

const path = require('path');

const EditorBase64 = require('./editor-base64.js');

exports['default'] = {

    contentType: null,
    subscriptions: null,

    activate(state) {
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
            'file-path-picker:pick-base64': () => {
                return this.pickFile(true);
            },
            'file-path-picker:to-base64': () => {
                return this.toBase64();
            }
        }));
    },

    getFileinDialog(callback) {
        let files = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {properties: ['openFile']});
        if(files && files.length) {
            callback && callback(files[0]);
        }
    },

    pickFile(base64) {

        let currentTextEditor = atom.workspace.getActiveTextEditor();
        if(!currentTextEditor) {
            return;
        }

        let currentPath = currentTextEditor.getPath();
        if(!currentPath) {
            return;
        }

        this.getFileinDialog(file => {

            if(base64) {
                let editorBase64 = new EditorBase64();
                editorBase64.base64Encode(file, data => {
                    currentTextEditor.insertText(data);
                    editorBase64.destroy();
                });
            }
            else {
                let relativePath = path.relative(path.dirname(currentPath), file);
                relativePath = encodeURI(relativePath.replace(/\\/g, '/'));
                currentTextEditor.insertText(relativePath);
            }

        });

    },

    toBase64() {

        let currentTextEditor = atom.workspace.getActiveTextEditor();
        let editorBase64 = new EditorBase64(currentTextEditor);

        editorBase64.doEncode(() => {
            editorBase64.destroy();
        });

    }
};

module.exports = exports['default'];
