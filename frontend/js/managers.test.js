import test from "node:test";
import assert from "node:assert/strict";
import {
    Employee,
    employees,
    attendanceRecords,
    payrollRecords,
    companySettings,
} from "./data.js";
import {
    Attendance,
    EmployeeManager,
    Payroll,
    PayrollManager,
} from "./managers.js";

function resetRecords() {
    employees.splice(0, employees.length,
        new Employee({
            id: 1,
            name: "Ali Khan",
            department: "Information Technology",
            designation: "Developer",
            basicSalary: 50000,
        }),
    );
    attendanceRecords.splice(0);
    payrollRecords.splice(0);
    companySettings[0].deductionRate = 5;
}

test.beforeEach(resetRecords);

test("employee manager adds, updates, searches, and deletes employees", () => {
    const manager = new EmployeeManager();
    const employee = manager.addEmployee({
        name: "Sara Ahmed",
        department: "Finance",
        designation: "Accountant",
        basicSalary: 60000,
    });

    assert.equal(employee.id, 2);
    assert.equal(manager.searchEmployees("SARA").length, 1);
    assert.equal(manager.searchEmployees("", "Finance", "Active").length, 1);

    manager.updateEmployee(employee.id, { name: "Sara Noor" });
    assert.equal(manager.getAllEmployees()[1].name, "Sara Noor");
    assert.equal(manager.deleteEmployee(employee.id).name, "Sara Noor");
    assert.equal(manager.getAllEmployees().length, 1);
});

test("employee manager rejects incomplete records and unknown updates", () => {
    const manager = new EmployeeManager();
    assert.throws(() => manager.addEmployee({ name: "No salary" }), /salary greater than zero/);
    assert.throws(() => manager.updateEmployee(999, { name: "Missing" }), /Employee not found/);
});

test("attendance updates the employee's existing record for the same date", () => {
    const attendance = new Attendance();
    attendance.markAttendance(1, "2026-11-24", "Present");
    attendance.markAttendance(1, "2026-11-24", "On Leave");

    assert.equal(attendanceRecords.length, 1);
    assert.deepEqual(attendance.calculateAttendance("2026-11-24"), {
        total: 1,
        present: 0,
        absent: 0,
        onLeave: 1,
    });
});

test("payroll calculates gross, deductions, and net salary", () => {
    const payroll = new Payroll(employees[0], {
        allowance: 5000,
        bonus: 2000,
        deductionRate: 5,
    });

    assert.equal(payroll.calculateGrossSalary(), 57000);
    assert.equal(payroll.calculateDeductions(), 2500);
    assert.equal(payroll.calculateNetSalary(), 54500);
});

test("payroll manager replaces a month instead of duplicating its records", () => {
    const manager = new PayrollManager();
    const first = manager.generatePayroll("2026-11", 10, 0);
    const second = manager.generatePayroll("2026-11", 20, 1000);

    assert.equal(first.length, 1);
    assert.equal(second.length, 1);
    assert.equal(payrollRecords.length, 1);
    assert.equal(manager.getPayrollHistory("2026-11")[0].allowances, 10000);
    assert.equal(manager.getPayrollHistory("2026-11")[0].bonus, 1000);
});
