import { Employee, employees, attendanceRecords, payrollRecords, companySettings } from "./data.js";

export class EmployeeManager {
    addEmployee(details) {
        const name = String(details.name || "").trim();
        const department = String(details.department || "").trim();
        const designation = String(details.designation || "").trim();
        const basicSalary = Number(details.basicSalary);
        if (!name || !department || !designation || !Number.isFinite(basicSalary) || basicSalary <= 0) {
            throw new Error("Enter a name, department, designation, and salary greater than zero.");
        }
        const nextId = employees.reduce((highest, employee) => Math.max(highest, employee.id), 0) + 1;
        const employee = new Employee({ ...details, id: nextId });
        employees.push(employee);
        return employee;
    }

    updateEmployee(id, updates) {
        const employee = employees.find((item) => item.id === Number(id));
        if (!employee) {
            throw new Error("Employee not found.");
        }
        const values = { ...employee, ...updates };
        const basicSalary = Number(values.basicSalary);
        if (!String(values.name || "").trim() || !String(values.department || "").trim()
            || !String(values.designation || "").trim() || !Number.isFinite(basicSalary) || basicSalary <= 0) {
            throw new Error("Enter a name, department, designation, and salary greater than zero.");
        }
        Object.assign(employee, new Employee({ ...values, id: employee.id }));
        return employee;
    }

    deleteEmployee(id) {
        const index = employees.findIndex((item) => item.id === Number(id));
        if (index === -1) {
            throw new Error("Employee not found.");
        }
        const [deleted] = employees.splice(index, 1);
        return deleted;
    }

    getAllEmployees() {
        return [...employees];
    }

    searchEmployees(query = "", department = "", status = "") {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return employees.filter((employee) => {
            const matchesQuery = !normalizedQuery
                || [employee.name, employee.department, employee.designation, employee.email, employee.phone, employee.id]
                    .some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery));
            return matchesQuery
                && (!department || employee.department === department)
                && (!status || employee.status === status);
        });
    }
}

export class Attendance {
    markAttendance(employeeId, date, status) {
        const employee = employees.find((item) => item.id === Number(employeeId));
        if (!employee) {
            throw new Error("Choose an existing employee.");
        }
        if (!date || !["Present", "Absent", "On Leave"].includes(status)) {
            throw new Error("Choose a date and a valid attendance status.");
        }
        const existing = attendanceRecords.find(
            (record) => record.employeeId === employee.id && record.date === date,
        );
        if (existing) {
            existing.status = status;
            return existing;
        }
        const record = {
            id: attendanceRecords.reduce((highest, item) => Math.max(highest, item.id), 0) + 1,
            employeeId: employee.id,
            employeeName: employee.name,
            department: employee.department,
            date,
            status,
        };
        attendanceRecords.push(record);
        return record;
    }

    calculateAttendance(date = "") {
        const records = date ? attendanceRecords.filter((record) => record.date === date) : attendanceRecords;
        return {
            total: records.length,
            present: records.filter((record) => record.status === "Present").length,
            absent: records.filter((record) => record.status === "Absent").length,
            onLeave: records.filter((record) => record.status === "On Leave").length,
        };
    }

    getAttendanceHistory(date = "") {
        return [...attendanceRecords]
            .filter((record) => !date || record.date === date)
            .sort((first, second) => second.date.localeCompare(first.date) || first.employeeName.localeCompare(second.employeeName));
    }
}

export class Payroll {
    constructor(employee, { allowance = 0, bonus = 0, deductionRate = companySettings[0].deductionRate } = {}) {
        this.employeeId = employee.id;
        this.employeeName = employee.name;
        this.department = employee.department;
        this.basicSalary = Number(employee.basicSalary);
        this.allowances = Number(allowance);
        this.bonus = Number(bonus);
        this.deductionRate = Number(deductionRate);
    }

    calculateGrossSalary() {
        return this.basicSalary + this.allowances + this.bonus;
    }

    calculateDeductions() {
        return Math.round(this.basicSalary * this.deductionRate / 100);
    }

    calculateNetSalary() {
        return this.calculateGrossSalary() - this.calculateDeductions();
    }

    generatePayroll(period) {
        if (!period || !/^\d{4}-\d{2}$/.test(period)) {
            throw new Error("Choose a valid payroll month.");
        }
        return {
            employeeId: this.employeeId,
            employeeName: this.employeeName,
            department: this.department,
            period,
            basicSalary: this.basicSalary,
            allowances: this.allowances,
            bonus: this.bonus,
            deductions: this.calculateDeductions(),
            grossSalary: this.calculateGrossSalary(),
            netSalary: this.calculateNetSalary(),
            generatedAt: new Date().toISOString(),
        };
    }
}

export class PayrollManager {
    generatePayroll(period, allowancePercent = 10, bonus = 0) {
        const percentage = Number(allowancePercent);
        const bonusAmount = Number(bonus);
        if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100
            || !Number.isFinite(bonusAmount) || bonusAmount < 0) {
            throw new Error("Allowances must be 0–100% and bonus cannot be negative.");
        }
        const activeEmployees = employees.filter((employee) => employee.status === "Active");
        if (!activeEmployees.length) {
            throw new Error("Add an active employee before generating payroll.");
        }
        const generated = activeEmployees.map((employee) => new Payroll(employee, {
            allowance: Math.round(employee.basicSalary * percentage / 100),
            bonus: bonusAmount,
        }).generatePayroll(period));

        for (let index = payrollRecords.length - 1; index >= 0; index -= 1) {
            if (payrollRecords[index].period === period) {
                payrollRecords.splice(index, 1);
            }
        }
        payrollRecords.push(...generated);
        return generated;
    }

    getPayrollHistory(period = "") {
        return [...payrollRecords]
            .filter((record) => !period || record.period === period)
            .sort((first, second) => second.period.localeCompare(first.period) || first.employeeName.localeCompare(second.employeeName));
    }
}

export const employeeManager = new EmployeeManager();
export const attendanceManager = new Attendance();
export const payrollManager = new PayrollManager();
