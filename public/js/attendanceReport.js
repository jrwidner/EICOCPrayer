document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const clearSelectionButton = document.getElementById('clear-selection');
    const ctx = document.getElementById('attendanceChart').getContext('2d');

    if (!spinner || !attendanceTable || !clearSelectionButton || !ctx) {
        console.error('One or more elements are missing in the DOM.');
        return;
    }

    spinner.style.display = 'block';

    async function fetchReport() {
        try {
            const response = await fetch('/missed-last-four-sundays');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            spinner.style.display = 'none';
            attendanceTable.innerHTML = ''; // Clear existing data
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));
            data.forEach(member => {
                const row = document.createElement('tr');
                const lastNameCell = document.createElement('td');
                lastNameCell.textContent = member.LastName;
                const firstNameCell = document.createElement('td');
                firstNameCell.textContent = member.FirstName;
                row.appendChild(lastNameCell);
                row.appendChild(firstNameCell);
                attendanceTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching members:', error);
            spinner.style.display = 'none';
        }
    }

    // Fetch the report when the page loads
    fetchReport();

    clearSelectionButton.addEventListener('click', () => {
        attendanceTable.innerHTML = ''; // Clear the table
    });
});