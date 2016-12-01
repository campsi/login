#!/usr/bin/env node
'use strict';
var inquirer = require('inquirer');
var questions = [{
    type: 'list',
    name: 'display',
    message: 'Display type',
    choices: [
        "modal",
        "inline",
        "fullscreen",
        "topbar"
    ]
}];

inquirer.prompt(questions).then(function (answers) {
    console.info(answers);
});

