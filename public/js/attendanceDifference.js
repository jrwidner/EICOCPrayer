document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const memberSelect = document.getElementById('member-select');

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

            // Sort data by last name in ascending order
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));

            // Populate member select options
            const uniqueNames = [...new Set(data.map(record => `${record.LastName}, ${record.FirstName}`))];
            uniqueNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                memberSelect.appendChild(option);
            });

            // Function to render the table based on selected members
            const renderTable = (selectedMembers) => {
                attendanceTable.innerHTML = '';

                let currentDate = '';
                let altBg = true;

                // Create the header rows
                const dateHeaderRow = document.createElement('tr');
                const serviceHeaderRow = document.createElement('tr');
                dateHeaderRow.innerHTML = `<th>Name</th>`;
                serviceHeaderRow.innerHTML = `<th></th>`;

                const uniqueDates = [...new Set(data.map(record => new Date(record.Date).toLocaleDateString()))];
                uniqueDates.forEach(date => {
                    altBg = !altBg;
                    dateHeaderRow.innerHTML += `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${date}</th>`;
                    serviceHeaderRow.innerHTML += `
                        <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Worship</th>
                        <th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Bible Class</th>
                    `;
                });

                attendanceTable.appendChild(dateHeaderRow);
                attendanceTable.appendChild(serviceHeaderRow);

                uniqueNames.forEach((name, index) => {
                    if (selectedMembers.length === 0 || selectedMembers.includes(name)) {
                        const nameRow = document.createElement('tr');
                        nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                        nameRow.innerHTML = `<td class="nowrap">${name}</td>`;
                        uniqueDates.forEach(date => {
                            const record = data.find(record => 
                                `${record.LastName}, ${record.FirstName}` === name && 
                                new Date(record.Date).toLocaleDateString() === date
                            );
                            if (record) {
                                nameRow.innerHTML += `
                                    <td class="nowrap">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                                    <td class="nowrap">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>
                                `;
                            } else {
                                nameRow.innerHTML += `
                                    <td class="nowrap"><span class="no-data">⦸</span></td>
                                    <td class="nowrap"><span class="no-data">⦸</span></td>
                                `;
                            }
                        });
                        attendanceTable.appendChild(nameRow);
                    }
                });
            };

            // Initial render with all members
            renderTable([]);

            // Event listener for member selection change
            memberSelect.addEventListener('change', () => {
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions);
            });
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            // Hide spinner in case of error
            spinner.style.display = 'none';
        });
});
