const inquirer = require('inquirer');
const mysql = require('mysql');
const cTable = require('console.table');

const connection = mysql.createConnection({
    host: 'localhost',

    port: 3306,

    user: 'root',

    password: 'idplMAl7*',
    database: 'employee_trackerDB'
});

const choiceList = [
    {
        name: "select",
        type: 'list',
        message: 'What would you like to do?',
        choices: ['View Departments', 'View Roles', 'View Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role', 'Exit']
    }
];

const viewTable = (table) => {
    connection.query(`SELECT * FROM ${table}`, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt(choiceList);
    });
};

const addDepartment = () => {
    inquirer.prompt([
        {
            name: 'department',
            type: 'input',
            message: 'What is the name of the department you would like to add?'
        }
    ])
    .then((answer) => {
        if(!answer.department) {
            console.log('Invalid input, please try again and type in a valid name');
            mainPrompt(choiceList);
        } else {
            connection.query('INSERT INTO department SET ?', {name: `${answer.department}`}, (err, res) => {
                if (err) throw err;
                console.log('Your department was successfully added');
                mainPrompt(choiceList);
            });
        };
    });
};

const mainPrompt = (list) => {
    inquirer.prompt(list)
    .then((answer) => {
        handleChoice(answer.select);
    })
}

const handleChoice = (answer) => {
    switch (answer) {
        case 'View Departments':
            viewTable('department');
            break;
        case 'View Roles':
            viewTable('role');
            break;
        case 'View Employees':
            viewTable('employee');
            break;
        case 'Add Department':
            addDepartment();
            break;
        case 'Add Role':
            addRole();
            break;
        case 'Add Employee':
            addEmployee();
            break;
        case 'Update Employee Role':
            updateEmployeeRole();
            break;
        case 'Exit':
            console.log("Thanks for using the Employee Tracker! Goodbye!");
            connection.end();
            break;
    };
};

const startPrompt = () => {
    console.log('Welcome to the Employee Tracker!');
    mainPrompt(choiceList);
};

startPrompt();