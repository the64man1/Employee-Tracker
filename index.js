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

let departments = [];
let roles = [];
let employees = [];

const choiceList = [
    {
        name: "select",
        type: 'list',
        message: 'What would you like to do?',
        choices: ['View Departments', 'View Roles', 'View Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role', 'Update Employee Manager', 'View Employees By Manager', 'Exit']
    }
];

const populateDepartments = () => {
    connection.query(`SELECT name FROM employee_trackerdb.department`, (err, res) => {
        if (err) throw err;
        res.forEach((raw) => {
            const department = raw.name;
            departments.push(department);
        })
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

const viewEmployees = () => {
    connection.query(`
    SELECT
        employee.id,
        employee.first_name,
        employee.last_name,
        role.title,
        role.salary,
        employee.manager_id,
        department.name AS 'department'
    FROM employee
    JOIN role
        ON employee.role_id = role.id
    JOIN department
        ON department.id = role.department_id`,
    (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt(choiceList);
    })
}

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

// async function deleteDepartment () {
//     let answer = await inquirer.prompt([
//         {
//             name: 'department',
//             type: 'list',
//             message: 'Which department would you like to delete? WARNING! Roles assigned to this department will now have "null" assigned as their department_id value!',
//             choices: [...departments]
//         }
//     ])

//     connection.query(`SELECT id FROM department WHERE name='${answer.department}'`, (err, res) => {
//         if (err) throw err;
//         const depId = res[0].id;
//         connection.query(`UPDATE role SET department_id = '0' WHERE department_id='${depId}'`, (err, res) => {
//             if (err) throw err;
//             connection.query(`DELETE FROM department WHERE id='${depId}'`, (err, res) => {
//                 if (err) throw err;
//                 console.log(`${answer.department} has been deleted, and roles assigned to this department now have 'null' in their department_id column`);
        
//                 departments = departments.filter(item => item !== answer.department)
//                 mainPrompt(choiceList);
//             })
//         })
//     })
// }

async function updateEmployeeManager () {
    let answer = await inquirer.prompt([
        {
            name: 'employee',
            type: 'list',
            message: 'For which employee would you like to update the manager?',
            choices: [...employees]
        },
        {
            name: 'manager',
            type: 'list',
            message: 'Who would you like to assign as his/her manager?',
            choices: [...employees, 'Employee now has no manager']
        }
    ])
    if (answer.employee === answer.manager) {
        console.log('You cannot make an employee his/her own manager');
        mainPrompt(choiceList);
    } else if (answer.manager === 'Employee now has no manager') {
        const employeeFullName = answer.employee.split(' ');
        const employeeFirstName = employeeFullName[0];
        const employeeLastName = employeeFullName[1];

        connection.query(`UPDATE employee_trackerdb.employee SET manager_id=null WHERE first_name='${employeeFirstName}' AND last_name='${employeeLastName}'`, (err, res) => {
                if (err) throw err;
                console.log(`${answer.employee} now has no manager`);
                mainPrompt(choiceList);
            })
    } else {
        const employeeFullName = answer.employee.split(' ');
        const employeeFirstName = employeeFullName[0];
        const employeeLastName = employeeFullName[1];

        const managerFullName = answer.manager.split(' ');
        const managerFirstName = managerFullName[0];
        const managerLastName = managerFullName[1];
        connection.query(`SELECT id FROM employee_trackerdb.employee WHERE first_name='${managerFirstName}' AND last_name='${managerLastName}'`, (err, res) => {
            if (err) throw err;
            const Id = res[0].id;
            connection.query(`UPDATE employee_trackerdb.employee SET manager_id='${Id}' WHERE first_name='${employeeFirstName}' AND last_name='${employeeLastName}'`, (err, res) => {
                if (err) throw err;
                console.log(`${answer.employee}'s manager has been updated to ${answer.manager}`);
                mainPrompt(choiceList);
            })
        })
    }
}

const viewEmployeesByManager = () => {
    connection.query(`
    SELECT
        CONCAT(e.first_name, " ", e.last_name) AS employee,
        CONCAT(m.first_name, " ", m.last_name) AS manager
    FROM employee_trackerdb.employee e
    LEFT JOIN employee_trackerdb.employee m ON m.id = e.manager_id
    ORDER BY manager;`,
    (err, res) => {
        if (err) throw err;
        console.table(res);
        mainPrompt(choiceList);
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
            viewEmployees();
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
        case 'Update Employee Manager':
            updateEmployeeManager();
            break;
        case 'View Employees By Manager':
            viewEmployeesByManager();
            break;
        // case 'Delete Department':
        //     deleteDepartment();
        //     break;
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