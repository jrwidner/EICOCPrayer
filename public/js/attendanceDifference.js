document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table');

    // Show spinner before fetching data
    spinner.style.display = 'block';

    // Fetch and display attendance data
    fetch('/api/attendance-difference')
        .then(response => response.json())
        .then(data => {
            // Hide spinner after data is fetched
            spinner.style.display = 'none';

            // Sort data by date, newest first
            data.sort((a, b) => new Date(b.Date) - new Date(a.Date));

            // Add this CSS to your stylesheet or within a <style> tag
            const style = document.createElement('style');
            style.innerHTML = `
                .nowrap {
                    white-space: nowrap;
                }
                .checkmark {
                    color: green;
                }
                .cross {
                    color: red;
                }
            `;
            document.head.appendChild(style);

            let currentDate = '';
            data.forEach(record => {
                const recordDate = new Date(record.Date).toLocaleDateString();
                if (recordDate !== currentDate) {
                    currentDate = recordDate;
                    const dateHeader = document.createElement('tr');
                    dateHeader.innerHTML = `<td colspan="4" valign="top"><b class="date-header">${currentDate}</b></td>`;
                    attendanceTable.appendChild(dateHeader);
                }
                const recordRow = document.createElement('tr');
                recordRow.classList.add('record-row');
                recordRow.innerHTML = `
                    <td class="nowrap">${record.LastName}, ${record.FirstName}</td>
                    <td class="nowrap">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                    <td class="nowrap">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                `;
                attendanceTable.appendChild(recordRow);
            });
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });
});
