import { employees, attendanceRecords, payrollRecords, companySettings } from "./data.js";
import { employeeManager, attendanceManager, payrollManager } from "./managers.js";

const app = document.querySelector("#app");
const setting = companySettings[0];
const pages = {
    "index.html": { key: "dashboard", title: "Dashboard", subtitle: "Your people and payroll at a glance." },
    "employees.html": { key: "employees", title: "Employees", subtitle: "Add, search, and manage employee records." },
    "attendance.html": { key: "attendance", title: "Attendance", subtitle: "Record and review daily attendance." },
    "payroll.html": { key: "payroll", title: "Payroll", subtitle: "Calculate and manage monthly salaries." },
    "salary-slips.html": { key: "salary-slips", title: "Salary Slips", subtitle: "Review and print employee salary slips." },
    "reports.html": { key: "reports", title: "Reports", subtitle: "Summaries generated from your records." },
    "settings.html": { key: "settings", title: "Settings", subtitle: "Update company payroll preferences." },
};
const navigation = [
    ["Dashboard", "index.html", "fa-house"],
    ["Employees", "employees.html", "fa-users"],
    ["Attendance", "attendance.html", "fa-calendar-check"],
    ["Payroll", "payroll.html", "fa-wallet"],
    ["Salary Slips", "salary-slips.html", "fa-file-invoice"],
    ["Reports", "reports.html", "fa-chart-line"],
    ["Settings", "settings.html", "fa-gear"],
];
let currentPage = "dashboard";
let notice = "";
let noticeType = "success";
let employeeSearch = "";
let departmentFilter = "";
let statusFilter = "";
let attendanceDate = localDate();
let slipPeriod = "";
let payrollPeriod = currentPeriod();

const icons = {
    "fa-house": "⌂",
    "fa-users": "♙",
    "fa-calendar-check": "✓",
    "fa-wallet": "₨",
    "fa-file-invoice": "▤",
    "fa-chart-line": "↗",
    "fa-gear": "⚙",
    "fa-user-plus": "+",
    "fa-building": "▦",
    "fa-user-check": "✓",
    "fa-user-slash": "×",
    "fa-money-bill-wave": "₨",
    "fa-user-xmark": "×",
    "fa-calendar-minus": "−",
    "fa-people-group": "♙",
    "fa-pen": "✎",
    "fa-trash": "×",
    "fa-calculator": "=",
    "fa-print": "⎙",
    "fa-magnifying-glass": "⌕",
    "fa-receipt": "▤",
    "fa-file-invoice-dollar": "₨",
    "fa-circle-info": "i",
    "fa-check": "✓",
    "fa-calendar": "▦",
};

function localDate(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function currentPeriod() {
    return localDate().slice(0, 7);
}

function icon(name) {
    return `<span class="icon" aria-hidden="true">${icons[name] || "•"}</span>`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[character]);
}

function money(value) {
    return `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
}

function formatPeriod(value) {
    if (!/^\d{4}-\d{2}$/.test(value || "")) return escapeHTML(value || "");
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PK", { month: "long", year: "numeric" }).format(new Date(year, month - 1));
}

function getDepartments() {
    return [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort();
}

function getPeriods() {
    return [...new Set(payrollRecords.map((record) => record.period))].sort((a, b) => b.localeCompare(a));
}

function getActiveNavClass(label) {
    const linkPage = pages[label[1]].key;
    return linkPage === currentPage ? " active" : "";
}

function shell(content) {
    const page = Object.values(pages).find((item) => item.key === currentPage) || pages["index.html"];
    document.title = `${page.title} | ${setting.companyName}`;
    const staticShell = app.querySelector(".app-shell");
    if (!staticShell) {
        app.innerHTML = `
            <div class="app-shell">
                <aside class="sidebar" id="sidebar">
                    <a class="brand" href="./index.html" data-nav><span class="brand-mark">R</span><span><strong>${escapeHTML(setting.companyName)}</strong><small>Employee Payroll System</small></span></a>
                    <nav class="sidebar-nav" aria-label="Main navigation">
                        <p class="nav-caption">WORKSPACE</p>
                        ${navigation.map(([label, href, iconName]) => `<a class="nav-link${getActiveNavClass([label, href])}" href="./${href}" data-nav>${icon(iconName)}<span>${label}</span></a>`).join("")}
                    </nav>
                    <div class="sidebar-footer"><span class="avatar">A</span><span><strong>Administrator</strong><small>Payroll Manager</small></span></div>
                </aside>
                <div class="main-content">
                    <header class="topbar"><div class="topbar-heading"><button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false">☰</button><div><h1 id="topbar-title">${page.title}</h1><p id="topbar-subtitle">${page.subtitle}</p></div></div><span class="topbar-date" id="topbar-date">${icon("fa-calendar")} ${new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date())}</span></header>
                    <main class="page-content"><div id="notice"></div><section id="page-content"></section><footer class="footer"><span id="footer-company">${escapeHTML(setting.companyName)}</span><span>University Project · In-memory data only</span></footer></main>
                </div>
            </div>`;
    }

    const staticPage = app.querySelector("#page-content[data-static-page]");
    const brand = app.querySelector(".brand");
    if (brand) brand.querySelector("strong").textContent = setting.companyName;
    app.querySelectorAll(".nav-link").forEach((link) => {
        const filename = link.getAttribute("href").replace("./", "");
        link.classList.toggle("active", pages[filename]?.key === currentPage);
    });
    app.querySelector("#topbar-title").textContent = page.title;
    app.querySelector("#topbar-subtitle").textContent = page.subtitle;
    app.querySelector("#topbar-date").innerHTML = `${icon("fa-calendar")} ${new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date())}`;
    app.querySelector("#notice").innerHTML = notice ? `<div class="notice ${noticeType}" role="status">${escapeHTML(notice)}</div>` : "";
    app.querySelector("#page-content").setAttribute("aria-busy", "false");
    if (!staticPage) app.querySelector("#page-content").innerHTML = content;
    app.querySelector("#footer-company").textContent = setting.companyName;
}

function statCard(label, value, iconName, tone, helper = "") {
    return `<article class="stat-card"><div class="stat-copy"><p>${label}</p><strong>${value}</strong>${helper ? `<small>${helper}</small>` : ""}</div><span class="stat-icon ${tone}">${icon(iconName)}</span></article>`;
}

function renderDashboard() {
    const active = employees.filter((employee) => employee.status === "Active");
    const attendance = attendanceManager.calculateAttendance(localDate());
    const latestPeriod = getPeriods()[0] || "";
    const latestPayroll = payrollManager.getPayrollHistory(latestPeriod);
    const payrollTotal = latestPayroll.reduce((total, record) => total + record.netSalary, 0);
    const paidDays = attendance.total ? Math.round(attendance.present * 100 / attendance.total) : 0;
    const departmentRows = getDepartments().map((department) => {
        const count = active.filter((employee) => employee.department === department).length;
        return `<div class="department-row"><span>${escapeHTML(department)}</span><strong>${count} active</strong></div>`;
    }).join("");
    const recentEmployees = [...employees].slice(-5).reverse();
    if (app.querySelector("#dashboard-stats")) {
        app.querySelector("#dashboard-stats").innerHTML =
            statCard("Total employees", employees.length, "fa-users", "blue", `${active.length} active employees`) +
            statCard("Departments", getDepartments().length, "fa-building", "purple", "Across your organization") +
            statCard("Present today", attendance.present, "fa-user-check", "green", `${attendance.absent} absent · ${attendance.onLeave} on leave`) +
            statCard("Latest payroll", money(payrollTotal), "fa-wallet", "orange", latestPeriod ? formatPeriod(latestPeriod) : "Generate your first payroll");
        app.querySelector("#attendance-summary-title").textContent = attendance.total ? `${paidDays}% of recorded employees are present` : "Mark attendance to see today's summary.";
        app.querySelector("#dashboard-attendance").innerHTML =
            `<div><span class="summary-dot present"></span><strong>${attendance.present}</strong><small>Present</small></div>` +
            `<div><span class="summary-dot absent"></span><strong>${attendance.absent}</strong><small>Absent</small></div>` +
            `<div><span class="summary-dot leave"></span><strong>${attendance.onLeave}</strong><small>On leave</small></div>`;
        app.querySelector("#attendance-progress").style.width = `${paidDays}%`;
        app.querySelector("#dashboard-departments").innerHTML = departmentRows || `<p class="empty-state">Add employees to see departments.</p>`;
        app.querySelector("#recent-employees").innerHTML = employeeTable(recentEmployees, false);
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">OVERVIEW</p><h2>Welcome to your payroll workspace</h2><p>Manage employees, attendance, and salary records in one place.</p></div><a class="button button-primary" href="./employees.html" data-nav>${icon("fa-user-plus")} Add employee</a></section>
        <section class="stats-grid" aria-label="Dashboard statistics">
            ${statCard("Total employees", employees.length, "fa-users", "blue", `${active.length} active employees`)}
            ${statCard("Departments", getDepartments().length, "fa-building", "purple", "Across your organization")}
            ${statCard("Present today", attendance.present, "fa-user-check", "green", `${attendance.absent} absent · ${attendance.onLeave} on leave`)}
            ${statCard("Latest payroll", money(payrollTotal), "fa-wallet", "orange", latestPeriod ? formatPeriod(latestPeriod) : "Generate your first payroll")}
        </section>
        <section class="dashboard-grid">
            <article class="card">
                <div class="card-heading"><div><h3>Attendance today</h3><p>${attendance.total ? `${paidDays}% of recorded employees are present` : "Mark attendance to see today's summary."}</p></div><a class="text-link" href="./attendance.html" data-nav>View attendance</a></div>
                <div class="attendance-summary">
                    <div><span class="summary-dot present"></span><strong>${attendance.present}</strong><small>Present</small></div>
                    <div><span class="summary-dot absent"></span><strong>${attendance.absent}</strong><small>Absent</small></div>
                    <div><span class="summary-dot leave"></span><strong>${attendance.onLeave}</strong><small>On leave</small></div>
                </div>
                <div class="progress-track"><span style="width:${paidDays}%"></span></div>
            </article>
            <article class="card">
                <div class="card-heading"><div><h3>Departments</h3><p>Active employees by team</p></div>${icon("fa-people-group")}</div>
                <div class="department-list">${departmentRows || `<p class="empty-state">Add employees to see departments.</p>`}</div>
            </article>
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Recent employees</h3><p>Your latest employee records</p></div><a class="text-link" href="./employees.html" data-nav>View all employees</a></div>
            ${employeeTable(recentEmployees, false)}
        </section>
    `);
}

function employeeTable(records, showActions = true) {
    if (!records.length) return `<div class="empty-state">No employees found. Add an employee to get started.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>DESIGNATION</th><th>BASIC SALARY</th><th>STATUS</th>${showActions ? "<th>ACTIONS</th>" : ""}</tr></thead><tbody>
        ${records.map((employee) => `<tr>
            <td><div class="employee-cell"><span class="table-avatar">${escapeHTML(employee.name.slice(0, 1).toUpperCase())}</span><span><strong>${escapeHTML(employee.name)}</strong><small>EMP-${String(employee.id).padStart(3, "0")} · ${escapeHTML(employee.email || employee.phone || "No contact details")}</small></span></div></td>
            <td>${escapeHTML(employee.department)}</td><td>${escapeHTML(employee.designation)}</td><td>${money(employee.basicSalary)}</td>
            <td><span class="status-badge ${employee.status === "Active" ? "status-active" : "status-inactive"}">${escapeHTML(employee.status)}</span></td>
            ${showActions ? `<td><div class="row-actions"><button class="icon-button" type="button" data-action="edit-employee" data-id="${employee.id}" aria-label="Edit ${escapeHTML(employee.name)}">${icon("fa-pen")}</button><button class="icon-button danger" type="button" data-action="delete-employee" data-id="${employee.id}" aria-label="Delete ${escapeHTML(employee.name)}">${icon("fa-trash")}</button></div></td>` : ""}
        </tr>`).join("")}
    </tbody></table></div>`;
}

function renderEmployees() {
    const departments = getDepartments();
    const records = employeeManager.searchEmployees(employeeSearch, departmentFilter, statusFilter);
    if (app.querySelector("#employee-table")) {
        app.querySelector("#employee-stats").innerHTML =
            statCard("All employees", employees.length, "fa-users", "blue") +
            statCard("Active employees", employees.filter((employee) => employee.status === "Active").length, "fa-user-check", "green") +
            statCard("Inactive employees", employees.filter((employee) => employee.status === "Inactive").length, "fa-user-slash", "orange");
        app.querySelector("#department-options").innerHTML = departments.map((department) => `<option value="${escapeHTML(department)}"></option>`).join("");
        app.querySelector("#employee-result-count").textContent = `${records.length} matching record${records.length === 1 ? "" : "s"}`;
        app.querySelector("#employee-table").innerHTML = employeeTable(records);
        const departmentFilterElement = app.querySelector("#department-filter");
        departmentFilterElement.innerHTML = `<option value="">All departments</option>` + departments.map((department) =>
            `<option value="${escapeHTML(department)}"${department === departmentFilter ? " selected" : ""}>${escapeHTML(department)}</option>`).join("");
        app.querySelector("#status-filter").value = statusFilter;
        app.querySelector("#employee-search").value = employeeSearch;
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">PEOPLE</p><h2>Employee directory</h2><p>Add, edit, search, and filter your employee records.</p></div><a class="button button-primary" href="#employee-form">+ Add employee</a></section>
        <section class="stats-grid stats-grid-three">
            ${statCard("All employees", employees.length, "fa-users", "blue")}
            ${statCard("Active employees", employees.filter((employee) => employee.status === "Active").length, "fa-user-check", "green")}
            ${statCard("Inactive employees", employees.filter((employee) => employee.status === "Inactive").length, "fa-user-slash", "orange")}
        </section>
        <section class="card" id="employee-form">
            <div class="card-heading"><div><h3 id="employee-form-title">Add an employee</h3><p>Employee records remain in memory until you refresh the page.</p></div></div>
            <form id="employee-form-element" class="form-grid">
                <input type="hidden" name="id">
                <label>Full name<input name="name" required maxlength="80" placeholder="e.g. Sara Ahmed"></label>
                <label>Department<input name="department" required maxlength="60" list="department-options" placeholder="e.g. Information Technology"><datalist id="department-options">${departments.map((department) => `<option value="${escapeHTML(department)}"></option>`).join("")}</datalist></label>
                <label>Designation<input name="designation" required maxlength="60" placeholder="e.g. Accountant"></label>
                <label>Basic salary (PKR)<input name="basicSalary" required type="number" min="1" step="1" placeholder="50000"></label>
                <label>Phone<input name="phone" type="tel" maxlength="24" placeholder="03XXXXXXXXX"></label>
                <label>Email<input name="email" type="email" maxlength="100" placeholder="employee@example.com"></label>
                <label>Status<select name="status"><option>Active</option><option>Inactive</option></select></label>
                <div class="form-actions"><button class="button button-primary" type="submit">Save employee</button><button class="button button-secondary hidden" id="cancel-edit" type="button">Cancel edit</button></div>
            </form>
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>All employees</h3><p>${records.length} matching record${records.length === 1 ? "" : "s"}</p></div></div>
            <div class="toolbar">
                <label class="search-box">${icon("fa-magnifying-glass")}<input id="employee-search" type="search" value="${escapeHTML(employeeSearch)}" placeholder="Search name, ID, or contact" aria-label="Search employees"></label>
                <select id="department-filter" aria-label="Filter by department"><option value="">All departments</option>${departments.map((department) => `<option value="${escapeHTML(department)}"${department === departmentFilter ? " selected" : ""}>${escapeHTML(department)}</option>`).join("")}</select>
                <select id="status-filter" aria-label="Filter by employee status"><option value="">All statuses</option><option value="Active"${statusFilter === "Active" ? " selected" : ""}>Active</option><option value="Inactive"${statusFilter === "Inactive" ? " selected" : ""}>Inactive</option></select>
            </div>
            ${employeeTable(records)}
        </section>
    `);
}

function attendanceTable(records) {
    if (!records.length) return `<div class="empty-state">No attendance records for this date.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>
        ${records.map((record) => `<tr><td><strong>${escapeHTML(record.employeeName)}</strong><small class="table-secondary">EMP-${String(record.employeeId).padStart(3, "0")}</small></td><td>${escapeHTML(record.department)}</td><td>${escapeHTML(record.date)}</td><td><span class="status-badge ${record.status === "Present" ? "status-active" : record.status === "Absent" ? "status-inactive" : "status-leave"}">${escapeHTML(record.status)}</span></td></tr>`).join("")}
    </tbody></table></div>`;
}

function renderAttendance() {
    const summary = attendanceManager.calculateAttendance(attendanceDate);
    const activeEmployees = employees.filter((employee) => employee.status === "Active");
    const records = attendanceManager.getAttendanceHistory(attendanceDate);
    if (app.querySelector("#attendance-table")) {
        app.querySelector("#attendance-stats").innerHTML =
            statCard("Present", summary.present, "fa-user-check", "green") +
            statCard("Absent", summary.absent, "fa-user-xmark", "orange") +
            statCard("On leave", summary.onLeave, "fa-calendar-minus", "purple");
        app.querySelector("#attendance-form [name='employeeId']").innerHTML = activeEmployees.map((employee) =>
            `<option value="${employee.id}">${escapeHTML(employee.name)} · EMP-${String(employee.id).padStart(3, "0")}</option>`).join("");
        app.querySelector("#attendance-form [name='date']").value = attendanceDate;
        app.querySelector("#attendance-date").value = attendanceDate;
        app.querySelector("#attendance-history-count").textContent = `${records.length} record${records.length === 1 ? "" : "s"} for ${attendanceDate}`;
        app.querySelector("#attendance-table").innerHTML = attendanceTable(records);
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">DAILY RECORDS</p><h2>Attendance management</h2><p>Mark attendance and update a record for the same employee and date.</p></div></section>
        <section class="stats-grid stats-grid-three">
            ${statCard("Present", summary.present, "fa-user-check", "green")}
            ${statCard("Absent", summary.absent, "fa-user-xmark", "orange")}
            ${statCard("On leave", summary.onLeave, "fa-calendar-minus", "purple")}
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Mark attendance</h3><p>Attendance is recorded for one employee and one date at a time.</p></div></div>
            ${activeEmployees.length ? `<form id="attendance-form" class="form-grid attendance-form">
                <label>Employee<select name="employeeId" required>${activeEmployees.map((employee) => `<option value="${employee.id}">${escapeHTML(employee.name)} · EMP-${String(employee.id).padStart(3, "0")}</option>`).join("")}</select></label>
                <label>Date<input name="date" type="date" value="${escapeHTML(attendanceDate)}" required></label>
                <label>Status<select name="status" required><option>Present</option><option>Absent</option><option>On Leave</option></select></label>
                <div class="form-actions"><button class="button button-primary" type="submit">${icon("fa-check")} Save attendance</button></div>
            </form>` : `<div class="empty-state">Add an active employee before marking attendance.</div>`}
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Attendance history</h3><p>${records.length} record${records.length === 1 ? "" : "s"} for ${escapeHTML(attendanceDate)}</p></div><label class="date-filter">Choose date<input id="attendance-date" type="date" value="${escapeHTML(attendanceDate)}"></label></div>
            ${attendanceTable(records)}
        </section>
    `);
}

function payrollTable(records) {
    if (!records.length) return `<div class="empty-state">No payroll for this period. Generate monthly payroll to get started.</div>`;
    return `<div class="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>PERIOD</th><th>BASIC</th><th>ALLOWANCES</th><th>BONUS</th><th>DEDUCTIONS</th><th>NET SALARY</th></tr></thead><tbody>
        ${records.map((record) => `<tr><td><strong>${escapeHTML(record.employeeName)}</strong><small class="table-secondary">${escapeHTML(record.department)}</small></td><td>${formatPeriod(record.period)}</td><td>${money(record.basicSalary)}</td><td>${money(record.allowances)}</td><td>${money(record.bonus)}</td><td>${money(record.deductions)}</td><td><strong>${money(record.netSalary)}</strong></td></tr>`).join("")}
    </tbody></table></div>`;
}

function renderPayroll() {
    const periods = getPeriods();
    const selectedPeriod = payrollPeriod;
    const periodOptions = [...new Set([currentPeriod(), selectedPeriod, ...periods])]
        .sort((first, second) => second.localeCompare(first));
    const records = payrollManager.getPayrollHistory(selectedPeriod);
    const gross = records.reduce((total, record) => total + record.grossSalary, 0);
    const net = records.reduce((total, record) => total + record.netSalary, 0);
    const deductions = records.reduce((total, record) => total + record.deductions, 0);
    if (app.querySelector("#payroll-table")) {
        app.querySelector("#payroll-stats").innerHTML =
            statCard("Gross payroll", money(gross), "fa-money-bill-wave", "blue") +
            statCard("Total deductions", money(deductions), "fa-receipt", "orange", `${setting.deductionRate}% of basic salary`) +
            statCard("Net payroll", money(net), "fa-wallet", "green");
        app.querySelector("#payroll-form [name='period']").value = selectedPeriod;
        app.querySelector("#payroll-history-title").textContent = `Showing ${formatPeriod(selectedPeriod)}`;
        app.querySelector("#payroll-period").innerHTML = periodOptions.map((period) =>
            `<option value="${escapeHTML(period)}"${period === selectedPeriod ? " selected" : ""}>${formatPeriod(period)}</option>`).join("");
        app.querySelector("#payroll-table").innerHTML = payrollTable(records);
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">SALARY PROCESSING</p><h2>Monthly payroll</h2><p>Generate salaries automatically for all active employees.</p></div></section>
        <section class="stats-grid stats-grid-three">
            ${statCard("Gross payroll", money(gross), "fa-money-bill-wave", "blue")}
            ${statCard("Total deductions", money(deductions), "fa-receipt", "orange", `${setting.deductionRate}% of basic salary`)}
            ${statCard("Net payroll", money(net), "fa-wallet", "green")}
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Generate monthly payroll</h3><p>Allowance is a percentage of basic pay; bonus is a fixed amount per employee.</p></div></div>
            <form id="payroll-form" class="form-grid payroll-form">
                <label>Payroll month<input name="period" type="month" value="${escapeHTML(selectedPeriod)}" required></label>
                <label>Allowances (%)<input name="allowancePercent" type="number" min="0" max="100" step="0.5" value="10" required></label>
                <label>Bonus per employee (PKR)<input name="bonus" type="number" min="0" step="1" value="0" required></label>
                <div class="form-actions"><button class="button button-primary" type="submit">${icon("fa-calculator")} Generate payroll</button></div>
            </form>
            <p class="form-hint">Deductions are calculated at ${setting.deductionRate}% of basic salary. Generating the same month again replaces its existing payroll records.</p>
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Payroll history</h3><p>Showing ${formatPeriod(selectedPeriod)}</p></div>
                <label class="date-filter">Payroll period<select id="payroll-period">${periodOptions.map((period) => `<option value="${escapeHTML(period)}"${period === selectedPeriod ? " selected" : ""}>${formatPeriod(period)}</option>`).join("")}</select></label>
            </div>
            ${payrollTable(records)}
        </section>
    `);
}

function renderSlips() {
    const periods = getPeriods();
    const selectedPeriod = slipPeriod || periods[0] || currentPeriod();
    const records = payrollManager.getPayrollHistory(selectedPeriod);
    if (app.querySelector("#salary-slips")) {
        app.querySelector("#slip-period").innerHTML =
            `<option value="${escapeHTML(currentPeriod())}"${selectedPeriod === currentPeriod() ? " selected" : ""}>${formatPeriod(currentPeriod())}</option>` +
            periods.filter((period) => period !== currentPeriod()).map((period) =>
                `<option value="${escapeHTML(period)}"${period === selectedPeriod ? " selected" : ""}>${formatPeriod(period)}</option>`).join("");
        app.querySelector("#salary-slips").innerHTML = records.length
            ? records.map((record) => salarySlip(record)).join("")
            : `<div class="empty-state">No salary slips for this month. Generate payroll first.</div>`;
        app.querySelector("#print-all-slips").hidden = !records.length;
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">EMPLOYEE DOCUMENTS</p><h2>Salary slips</h2><p>Print an individual salary statement or print all slips for this month.</p></div>${records.length ? `<button class="button button-secondary" type="button" data-action="print-all">${icon("fa-print")} Print all</button>` : ""}</section>
        <section class="card">
            <div class="card-heading"><div><h3>Generated salary slips</h3><p>Slips are available after generating a payroll period.</p></div><label class="date-filter">Payroll period<select id="slip-period"><option value="${escapeHTML(currentPeriod())}"${selectedPeriod === currentPeriod() ? " selected" : ""}>${formatPeriod(currentPeriod())}</option>${periods.filter((period) => period !== currentPeriod()).map((period) => `<option value="${escapeHTML(period)}"${period === selectedPeriod ? " selected" : ""}>${formatPeriod(period)}</option>`).join("")}</select></label></div>
            ${records.length ? `<div class="slips-grid">${records.map((record) => salarySlip(record)).join("")}</div>` : `<div class="empty-state">No salary slips for this month. Generate payroll first.</div>`}
        </section>
    `);
}

function salarySlip(record) {
    return `<article class="salary-slip" data-slip="${record.employeeId}">
        <div class="slip-brand"><div><p class="eyebrow">SALARY STATEMENT</p><h3>${escapeHTML(setting.companyName)}</h3></div><span class="slip-period">${formatPeriod(record.period)}</span></div>
        <div class="slip-employee"><strong>${escapeHTML(record.employeeName)}</strong><span>Employee ID: EMP-${String(record.employeeId).padStart(3, "0")}</span><span>${escapeHTML(record.department)}</span></div>
        <div class="slip-lines"><div><span>Basic salary</span><strong>${money(record.basicSalary)}</strong></div><div><span>Allowances</span><strong>${money(record.allowances)}</strong></div><div><span>Bonus</span><strong>${money(record.bonus)}</strong></div><div><span>Gross salary</span><strong>${money(record.grossSalary)}</strong></div><div class="deduction-line"><span>Deductions</span><strong>− ${money(record.deductions)}</strong></div></div>
        <div class="slip-net"><span>Net salary</span><strong>${money(record.netSalary)}</strong></div>
        <button class="button button-secondary print-one" type="button" data-action="print-slip" data-id="${record.employeeId}">${icon("fa-print")} Print slip</button>
    </article>`;
}

function renderReports() {
    const attendance = attendanceManager.calculateAttendance();
    const allPayroll = payrollManager.getPayrollHistory();
    const departmentNames = [...new Set([
        ...getDepartments(),
        ...allPayroll.map((record) => record.department),
    ])].sort();
    const departmentRows = departmentNames.map((department) => {
        const people = employees.filter((employee) => employee.department === department);
        const salaries = allPayroll.filter((record) => record.department === department);
        return `<tr><td>${escapeHTML(department)}</td><td>${people.length}</td><td>${salaries.length}</td><td>${money(salaries.reduce((sum, record) => sum + record.netSalary, 0))}</td></tr>`;
    }).join("");
    if (app.querySelector("#report-stats")) {
        app.querySelector("#report-stats").innerHTML =
            statCard("Employees", employees.length, "fa-users", "blue", `${employees.filter((employee) => employee.status === "Active").length} active`) +
            statCard("Attendance records", attendance.total, "fa-calendar-check", "purple", `${attendance.present} present · ${attendance.absent} absent`) +
            statCard("Payroll records", allPayroll.length, "fa-file-invoice-dollar", "green", `${getPeriods().length} payroll periods`) +
            statCard("Total net payroll", money(allPayroll.reduce((sum, record) => sum + record.netSalary, 0)), "fa-wallet", "orange", "All generated periods");
        app.querySelector("#department-report").innerHTML = departmentNames.length
            ? `<div class="table-wrap"><table><thead><tr><th>DEPARTMENT</th><th>EMPLOYEES</th><th>PAYROLL ENTRIES</th><th>NET PAYROLL</th></tr></thead><tbody>${departmentRows}</tbody></table></div>`
            : `<div class="empty-state">Add employees to see the department report.</div>`;
        app.querySelector("#monthly-report").innerHTML = getPeriods().length
            ? `<div class="table-wrap"><table><thead><tr><th>PERIOD</th><th>EMPLOYEES PAID</th><th>GROSS TOTAL</th><th>DEDUCTIONS</th><th>NET TOTAL</th></tr></thead><tbody>${getPeriods().map((period) => {
                const records = allPayroll.filter((record) => record.period === period);
                return `<tr><td>${formatPeriod(period)}</td><td>${records.length}</td><td>${money(records.reduce((sum, record) => sum + record.grossSalary, 0))}</td><td>${money(records.reduce((sum, record) => sum + record.deductions, 0))}</td><td><strong>${money(records.reduce((sum, record) => sum + record.netSalary, 0))}</strong></td></tr>`;
            }).join("")}</tbody></table></div>`
            : `<div class="empty-state">Generate payroll to build a monthly report.</div>`;
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">BUSINESS SUMMARY</p><h2>Payroll reports</h2><p>Report totals are generated from the current in-memory records.</p></div><button class="button button-secondary" type="button" data-action="print-report">${icon("fa-print")} Print report</button></section>
        <section class="stats-grid">
            ${statCard("Employees", employees.length, "fa-users", "blue", `${employees.filter((employee) => employee.status === "Active").length} active`)}
            ${statCard("Attendance records", attendance.total, "fa-calendar-check", "purple", `${attendance.present} present · ${attendance.absent} absent`)}
            ${statCard("Payroll records", allPayroll.length, "fa-file-invoice-dollar", "green", `${getPeriods().length} payroll periods`)}
            ${statCard("Total net payroll", money(allPayroll.reduce((sum, record) => sum + record.netSalary, 0)), "fa-wallet", "orange", "All generated periods")}
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Department breakdown</h3><p>Employee count and generated net payroll by department</p></div></div>
            ${departmentNames.length ? `<div class="table-wrap"><table><thead><tr><th>DEPARTMENT</th><th>EMPLOYEES</th><th>PAYROLL ENTRIES</th><th>NET PAYROLL</th></tr></thead><tbody>${departmentRows}</tbody></table></div>` : `<div class="empty-state">Add employees to see the department report.</div>`}
        </section>
        <section class="card">
            <div class="card-heading"><div><h3>Payroll by month</h3><p>Total net salary generated for each month</p></div></div>
            ${getPeriods().length ? `<div class="table-wrap"><table><thead><tr><th>PERIOD</th><th>EMPLOYEES PAID</th><th>GROSS TOTAL</th><th>DEDUCTIONS</th><th>NET TOTAL</th></tr></thead><tbody>${getPeriods().map((period) => {
                const records = allPayroll.filter((record) => record.period === period);
                return `<tr><td>${formatPeriod(period)}</td><td>${records.length}</td><td>${money(records.reduce((sum, record) => sum + record.grossSalary, 0))}</td><td>${money(records.reduce((sum, record) => sum + record.deductions, 0))}</td><td><strong>${money(records.reduce((sum, record) => sum + record.netSalary, 0))}</strong></td></tr>`;
            }).join("")}</tbody></table></div>` : `<div class="empty-state">Generate payroll to build a monthly report.</div>`}
        </section>
    `);
}

function renderSettings() {
    if (app.querySelector("#settings-form")) {
        app.querySelector("#settings-form [name='companyName']").value = setting.companyName;
        app.querySelector("#settings-form [name='deductionRate']").value = setting.deductionRate;
        shell("");
        return;
    }
    shell(`
        <section class="page-intro"><div><p class="eyebrow">PREFERENCES</p><h2>Company settings</h2><p>These details are kept in the shared JavaScript module for this session.</p></div></section>
        <section class="card settings-card">
            <div class="card-heading"><div><h3>Payroll preferences</h3><p>Salary amounts throughout the application are shown in Pakistani Rupees (PKR).</p></div></div>
            <form id="settings-form" class="settings-form">
                <label>Company name<input name="companyName" value="${escapeHTML(setting.companyName)}" maxlength="80" required></label>
                <label>Currency<input value="PKR · Pakistani Rupee" disabled></label>
                <label>Deduction rate (% of basic salary)<input name="deductionRate" type="number" min="0" max="100" step="0.5" value="${escapeHTML(setting.deductionRate)}" required></label>
                <button class="button button-primary" type="submit">Save settings</button>
            </form>
            <div class="info-note">${icon("fa-circle-info")}<p>No browser storage, API, database, or backend is used. Sample data returns when the page is refreshed or reopened.</p></div>
        </section>
    `);
}

function render() {
    notice = notice || "";
    switch (currentPage) {
        case "employees": renderEmployees(); break;
        case "attendance": renderAttendance(); break;
        case "payroll": renderPayroll(); break;
        case "salary-slips": renderSlips(); break;
        case "reports": renderReports(); break;
        case "settings": renderSettings(); break;
        default: currentPage = "dashboard"; renderDashboard();
    }
}

function pageKeyFromUrl(url) {
    const filename = url.pathname.split("/").pop() || "index.html";
    return (pages[filename] || pages["index.html"]).key;
}

function navigate(url, addHistory = true) {
    currentPage = pageKeyFromUrl(url);
    if (addHistory) history.pushState({ page: currentPage }, "", url);
    notice = "";
    render();
    window.scrollTo(0, 0);
}

function showNotice(message, type = "success") {
    notice = message;
    noticeType = type;
    render();
    window.scrollTo(0, 0);
}

function resetEmployeeForm() {
    const form = document.querySelector("#employee-form-element");
    if (!form) return;
    form.reset();
    form.elements.id.value = "";
    document.querySelector("#employee-form-title").textContent = "Add an employee";
    document.querySelector("#cancel-edit").classList.add("hidden");
}

class EmployeeController {
    constructor(manager) {
        this.manager = manager;
    }

    save(form) {
        const data = Object.fromEntries(new FormData(form));
        if (data.id) {
            this.manager.updateEmployee(data.id, data);
            return "Employee details updated.";
        }
        this.manager.addEmployee(data);
        return "Employee added successfully.";
    }

    delete(id) {
        return this.manager.deleteEmployee(id);
    }
}

const employeeController = new EmployeeController(employeeManager);

function handleEmployeeSubmit(form) {
    try {
        showNotice(employeeController.save(form));
    } catch (error) {
        showNotice(error.message, "error");
    }
}

function handleClick(event) {
    const link = event.target.closest("a[data-nav]");
    if (link) return;

    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    switch (button.dataset.action) {
        case "edit-employee": {
            const employee = employees.find((item) => item.id === id);
            if (!employee) return;
            const form = document.querySelector("#employee-form-element");
            for (const [key, value] of Object.entries(employee)) {
                if (form.elements[key]) form.elements[key].value = value;
            }
            document.querySelector("#employee-form-title").textContent = `Edit ${employee.name}`;
            document.querySelector("#cancel-edit").classList.remove("hidden");
            document.querySelector("#employee-form").scrollIntoView({ behavior: "smooth" });
            break;
        }
        case "delete-employee": {
            const employee = employees.find((item) => item.id === id);
            if (!employee || !window.confirm(`Delete ${employee.name}?`)) return;
            employeeController.delete(id);
            render();
            showNotice("Employee deleted.");
            break;
        }
        case "print-slip":
            printSlips(id);
            break;
        case "print-all":
            printSlips();
            break;
        case "print-report":
            window.print();
            break;
        default:
            break;
    }
}

function printSlips(employeeId = null) {
    document.body.classList.toggle("printing-slips", true);
    for (const slip of document.querySelectorAll(".salary-slip")) {
        slip.classList.toggle("print-hidden", employeeId !== null && Number(slip.dataset.slip) !== employeeId);
    }
    window.addEventListener("afterprint", () => {
        document.body.classList.remove("printing-slips");
        for (const slip of document.querySelectorAll(".salary-slip")) slip.classList.remove("print-hidden");
    }, { once: true });
    window.print();
}

app.addEventListener("click", handleClick);
app.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = event.target.getAttribute("id");
    if (id === "employee-form-element") {
        handleEmployeeSubmit(event.target);
        return;
    }
    if (id === "attendance-form") {
        try {
            const data = Object.fromEntries(new FormData(event.target));
            attendanceManager.markAttendance(data.employeeId, data.date, data.status);
            attendanceDate = data.date;
            showNotice("Attendance saved successfully.");
        } catch (error) {
            showNotice(error.message, "error");
        }
        return;
    }
    if (id === "payroll-form") {
        try {
            const data = Object.fromEntries(new FormData(event.target));
            payrollPeriod = data.period;
            const records = payrollManager.generatePayroll(data.period, data.allowancePercent, data.bonus);
            showNotice(`Payroll generated for ${formatPeriod(data.period)}: ${records.length} employee record${records.length === 1 ? "" : "s"}.`);
        } catch (error) {
            showNotice(error.message, "error");
        }
        return;
    }
    if (id === "settings-form") {
        const data = Object.fromEntries(new FormData(event.target));
        const rate = Number(data.deductionRate);
        if (!data.companyName.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) {
            showNotice("Enter a company name and a deduction rate between 0 and 100.", "error");
            return;
        }
        setting.companyName = data.companyName.trim();
        setting.deductionRate = rate;
        showNotice("Company settings saved.");
    }
});

app.addEventListener("input", (event) => {
    if (event.target.id !== "employee-search") return;
    employeeSearch = event.target.value;
    const cursor = event.target.selectionStart;
    renderEmployees();
    const search = document.querySelector("#employee-search");
    search.focus();
    search.setSelectionRange(cursor, cursor);
});

app.addEventListener("change", (event) => {
    if (event.target.id === "department-filter") {
        departmentFilter = event.target.value;
        renderEmployees();
    } else if (event.target.id === "status-filter") {
        statusFilter = event.target.value;
        renderEmployees();
    } else if (event.target.id === "attendance-date") {
        attendanceDate = event.target.value || localDate();
        renderAttendance();
    } else if (event.target.id === "payroll-period") {
        payrollPeriod = event.target.value;
        renderPayroll();
    } else if (event.target.name === "period" && event.target.form?.id === "payroll-form") {
        payrollPeriod = event.target.value;
        const periodFilter = document.querySelector("#payroll-period");
        if (periodFilter) periodFilter.value = payrollPeriod;
    } else if (event.target.id === "slip-period") {
        slipPeriod = event.target.value;
        renderSlips();
    }
});

app.addEventListener("click", (event) => {
    if (event.target.closest("#cancel-edit")) resetEmployeeForm();
    if (event.target.closest(".menu-toggle")) {
        const sidebar = document.querySelector(".sidebar");
        const expanded = sidebar.classList.toggle("sidebar-open");
        document.querySelector(".menu-toggle").setAttribute("aria-expanded", String(expanded));
    }
});

window.addEventListener("popstate", () => {
    currentPage = pageKeyFromUrl(new URL(window.location.href));
    notice = "";
    render();
});

currentPage = pageKeyFromUrl(new URL(window.location.href));
render();
