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

const departments = [];
const roles = [];
const employees = [];

const choiceList = [
    {
        name: "select",
        type: 'list',
        message: 'What would you like to do?',
        choices: ['View Departments', 'View Roles', 'View Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role', 'Exit']
    }
];

const populateDepartments = () => {
    connection.query(`SELECT name FROM employee_trackerdb.department`, (err, res) => {
        if (err) throw err;
        for (let i = 0; i < res.length; i++) {
            departments.push(res[i].name);
        }
    })
}

const populateRoles = () => {
    connection.query(`SELECT title FROM employee_trackerdb.role`, (err, res) => {
        if (err) throw err;
        res.forEach((raw) => {
            const role = raw.title;
            roles.push(role);
        })
    })
}

const populateEmployees = () => {
    connection.query(`SELECT first_name, last_name FROM employee_trackerdb.employee`, (err, res) => {
        if (err) throw err;
        res.forEach((raw) => {
            const firstname = raw.first_name;
            const lastname = raw.last_name;
            const fullname = `${firstname} ${lastname}`;
            employees.push(fullname);
        })
    })
}

const viewTable = (table) => {
     connection.query(`SELECT * FROM ${table}`, (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt(choiceList);
    });
};

const viewRoles = () => {
    connection.query(`
    SELECT role.id, role.title, role.salary, department.name AS 'department'
    FROM employee_trackerdb.role
    LEFT JOIN employee_trackerdb.department
    ON role.department_id = department.id`,
    (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt(choiceList);
    })
}

// const viewEmployees = () => {

// }

async function addDepartment () {
    const answer = await inquirer.prompt([
        {
            name: 'department',
            type: 'input',
            message: 'What is the name of the department you would like to add?'
        }
    ])

    if(!answer.department) {
        console.log('Invalid input, please try again and type in a valid name');
        mainPrompt(choiceList);
    } else {
        const department = answer.department;
        departments.push(department);

        connection.query('INSERT INTO department SET ?', {name: `${department}`}, (err, res) => {
            if (err) throw err;
            console.log(`${department} was successfully added`);
            mainPrompt(choiceList);
        });
    };
}

async function addRole () {

    const answer = await inquirer.prompt([
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
    ])

    if(!answer.title || !answer.salary) {
        console.log('Invalid input, please try again and type in a valid title and/or salary');
        mainPrompt(choiceList);
    } else {
        const role = answer.title;
        roles.push(role);

        connection.query(`SELECT id FROM employee_trackerdb.department WHERE name='${answer.department}'`, (err, res) => {
            if (err) throw err;
            const departmentId = res[0].id;
            connection.query('INSERT INTO role SET ?', { title: `${answer.title}`, salary: `${answer.salary}`, department_id: `${departmentId}` }, (err, res) => {
                if (err) throw err;
                console.log(`${role} was successfully added`);
                mainPrompt(choiceList);
            });
        });
    };
}

async function addEmployee () {

    let answer = await inquirer.prompt([
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
    ])

    if(!answer.firstname || !answer.lastname) {
        console.log('Invalid input, please try again and type in a valid first and/or last name');
        mainPrompt(choiceList);
    } else {
        const employee = `${answer.firstname} ${answer.lastname}`;
        employees.push(employee);

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
                    console.log(`${employee} was succesfully added`);
                    mainPrompt(choiceList);
                });
            });
        });
    };
}

async function updateEmployeeRole () {
    let answer = await inquirer.prompt([
        {
            name: 'name',
            type: 'list',
            message: 'What is the name of the employee whose role you wish to update?',
            choices: [...employees]
        },
        {
            name: 'role',
            type: 'list',
            message:'Which role do you wish to assign to this employee?',
            choices: [...roles]
        }
    ])
    const fullName = answer.name.split(' ');
    const firstName = fullName[0];
    const lastName = fullName[1];
    connection.query(`SELECT id FROM employee_trackerdb.role WHERE title='${answer.role}'`, (err, res) => {
        if (err) throw err;
        const roleId = res[0].id;
        connection.query(`UPDATE employee_trackerdb.employee SET role_id='${roleId}' WHERE first_name='${firstName}' AND last_name='${lastName}'`, (err, res) => {
            if (err) throw err;
            console.log(`${answer.name}'s role was changed to ${answer.role}`);
            mainPrompt(choiceList);
        })
    })
}

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
            viewRoles();
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

populateDepartments();
populateRoles();
populateEmployees();
startPrompt();