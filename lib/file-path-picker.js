'use strict';

const { CompositeDisposable } = require('atom');
const remote = require('remote');

const os = require('os');
const path = require('path');

exports['default'] = {

    subscriptions: null,
    fileInput: null,

    activate(state) {
        this.subscriptions = new CompositeDisposable();
        this.registerCommands();
    },

    deactivate() {
        return this.subscriptions.dispose();
    },

    registerCommands() {
        return this.subscriptions.add(atom.commands.add('atom-workspace', {
            'file-path-picker:pick-file': () => {
                return this.pickFile();
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

    }
};

module.exports = exports['default'];
