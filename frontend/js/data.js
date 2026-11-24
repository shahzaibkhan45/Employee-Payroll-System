export class Employee {
    constructor({ id, name, department, designation, basicSalary, phone = "", email = "", status = "Active" }) {
        this.id = Number(id);
        this.name = name.trim();
        this.department = department.trim();
        this.designation = designation.trim();
        this.basicSalary = Number(basicSalary);
        this.phone = phone.trim();
        this.email = email.trim();
        this.status = status;
    }
}

export let employees = [
    new Employee({ id: 1, name: "Ali Khan", department: "Information Technology", designation: "Software Developer", basicSalary: 85000, phone: "03001234567", email: "ali.khan@example.com" }),
    new Employee({ id: 2, name: "Ayesha Malik", department: "Human Resources", designation: "HR Officer", basicSalary: 72000, phone: "03012345678", email: "ayesha.malik@example.com" }),
    new Employee({ id: 3, name: "Usman Ahmed", department: "Finance", designation: "Accountant", basicSalary: 68000, phone: "03023456789", email: "usman.ahmed@example.com" }),
    new Employee({ id: 4, name: "Fatima Noor", department: "Marketing", designation: "Marketing Executive", basicSalary: 65000, phone: "03034567890", email: "fatima.noor@example.com" }),
    new Employee({ id: 5, name: "Hassan Raza", department: "Production", designation: "Production Supervisor", basicSalary: 78000, phone: "03045678901", email: "hassan.raza@example.com", status: "Inactive" }),
];

export const attendanceRecords = [];
export const payrollRecords = [];
export const companySettings = [
    { companyName: "Rajby Textiles", currency: "PKR", deductionRate: 5 },
];
