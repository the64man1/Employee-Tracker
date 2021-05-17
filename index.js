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

const departments = ['Sales', 'Legal', 'Finance', 'Engineering'];
const roles = ['Business Developer', 'Lawyer', 'Accountant', 'Software Developer'];
const employees = ['Jack Johnson', 'Sally Smith', 'Bobby Lee', 'Cynthia Burns', 'Tommy Stallings']

const choiceList = [
    {
        name: "select",
        type: 'list',
        message: 'What would you like to do?',
        choices: ['View Departments', 'View Roles', 'View Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role', 'Exit']
    }
];

const addRolePrompts = [
    {
        name: 'title',
        type: 'input',
        message: 'What is the title of the role you would like to add?'
    },
    {
        name: 'salary',
        type: 'input',
        message: 'What is the salary of the role you are adding?'
    },
    {
        name: 'department',
        type: 'list',
        message: 'To which department would you like to assign your new role?',
        choices: [...departments]
    }
]

const addEmployeePrompts = [
    {
        name: 'firstname',
        type: 'input',
        message: 'What is the first name of the employee you would like to add?'
    },
    {
        name: 'lastname',
        type: 'input',
        message: 'What is the last name of the employee you would like to add?'
    },
    {
        name: 'role',
        type: 'list',
        message: 'What is the role of the employee you are adding?',
        choices: [...roles]
    },
    {
        name: 'manager',
        type: 'list',
        message: 'Who is this employees manager?',
        choices: [...employees, 'Employee does not have a manager']
    }
]

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

const addRole = () => {
    inquirer.prompt(addRolePrompts)
    .then((answer) => {
        if(!answer.title || !answer.salary) {
            console.log('Invalid input, please try again and type in a valid title and/or salary');
            mainPrompt(choiceList);
        } else {
            connection.query(`SELECT id FROM employee_trackerdb.department WHERE name='${answer.department}'`, (err, res) => {
                if (err) throw err;
                const departmentId = res[0].id;
                connection.query('INSERT INTO role SET ?', { title: `${answer.title}`, salary: `${answer.salary}`, department_id: `${departmentId}` }, (err, res) => {
                    if (err) throw err;
                    console.log('Your role was successfully added');
                    mainPrompt(choiceList);
                });
            });
        };
    });
};

const addEmployee = () => {
    inquirer.prompt(addEmployeePrompts)
    .then((answer) => {
        if(!answer.firstname || !answer.lastname) {
            console.log('Invalid input, please try again and type in a valid first and/or last name');
            mainPrompt(choiceList);
        } else {
            const managerFullName = answer.manager.split(' ');
            const managerFirstName = managerFullName[0];
            const managerLastName = managerFullName[1];
            connection.query(`SELECT id FROM employee_trackerdb.role WHERE title='${answer.role}'`, (err, res) => {
                if (err) throw err;
                const roleId = res[0].id;
                connection.query(`SELECT id FROM employee_trackerdb.employee WHERE first_name='${managerFirstName}' AND last_name='${managerLastName}'`, (err, res) => {
                    if (err) throw err;
                    const managerId = res[0].id;
                    connection.query(`INSERT INTO employee SET ?`, { first_name: `${answer.firstname}`, last_name: `${answer.lastname}`, role_id: `${roleId}`, manager_id: `${managerId}` }, (err, res) => {
                        if (err) throw err;
                        console.log('The employee was succesfully added');
                        mainPrompt(choiceList);
                    });
                });
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