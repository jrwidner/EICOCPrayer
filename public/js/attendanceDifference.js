document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const attendanceTable = document.getElementById('attendance-table').querySelector('tbody');
    const memberSelect = document.getElementById('member-select');
    const clearSelectionButton = document.getElementById('clear-selection');
    const attendanceFilter = document.getElementById('attendance-filter');
    const infoBlock = document.getElementById('info-block');
    const ctx = document.getElementById('attendanceChart').getContext('2d');

    if (!spinner || !attendanceTable || !memberSelect || !clearSelectionButton || !infoBlock || !ctx) {
        console.error('One or more elements are missing in the DOM.');
        return;
    }

    // Function to format dates as MM-DD-YYYY without localization
    function formatDateToMMDDYYYY(dateString) {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${month}-${day}-${year}`;
    }

    spinner.style.display = 'block';
    fetch('/api/attendance-difference')
        .then(response => response.json())
        .then(data => {
            spinner.style.display = 'none';
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));

            const uniqueNames = new Set();
            const rawDates = new Set();
            const memberRecordsMap = new Map();

            data.forEach(record => {
                const name = `${record.LastName}, ${record.FirstName}`;
                uniqueNames.add(name);
                rawDates.add(record.Date);

                if (!memberRecordsMap.has(name)) {
                    memberRecordsMap.set(name, []);
                }
                memberRecordsMap.get(name).push(record);
            });

            // Sort dates newest to oldest
            const sortedRawDates = Array.from(rawDates).sort((a, b) => new Date(b) - new Date(a));
            const sortedFormattedDates = sortedRawDates.map(date => formatDateToMMDDYYYY(date));

            const fragment = document.createDocumentFragment();
            uniqueNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                fragment.appendChild(option);
            });
            memberSelect.appendChild(fragment);

            const calculateAttendance = (records) => {
                const worshipCount = records.filter(record => record.WorshipService).length;
                const bibleClassCount = records.filter(record => record.BibleClass).length;
                const worshipPercentage = sortedRawDates.length ? (worshipCount / sortedRawDates.length * 100).toFixed(2) : 0;
                const bibleClassPercentage = worshipCount ? (bibleClassCount / worshipCount * 100).toFixed(2) : 0;
                return { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords: records.length };
            };

            const renderTable = (selectedMembers, worshipFilterCriteria = 'all') => {
                attendanceTable.innerHTML = '';
                const filteredNames = Array.from(memberRecordsMap.keys());

                const fragment = document.createDocumentFragment();
                let altBg = true;
                const dateHeaderRow = document.createElement('tr');
                const serviceHeaderRow = document.createElement('tr');
                dateHeaderRow.innerHTML = `<th>Name</th>`;
                serviceHeaderRow.innerHTML = `<th></th>`;
                sortedFormattedDates.forEach(date => {
                    altBg = !altBg;
                    dateHeaderRow.innerHTML += `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${date}</th>`;
                    serviceHeaderRow.innerHTML += `<th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Worship</th><th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Class</th>`;
                });
                fragment.appendChild(dateHeaderRow);
                fragment.appendChild(serviceHeaderRow);

                filteredNames.forEach((name, index) => {
                    const records = memberRecordsMap.get(name);
                    const { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount } = calculateAttendance(records);
                    const nameRow = document.createElement('tr');
                    nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                    nameRow.innerHTML = `<td class="nowrap"><span class="name">${name}</span><br>${worshipCount} Worships <span>${worshipPercentage}%</span> - ${bibleClassCount} Bible Classes <span>${bibleClassPercentage}%</span></td>`;
                    sortedRawDates.forEach(date => {
                        const record = records.find(record => record.Date === date);
                        if (record) {
                            nameRow.innerHTML += `<td class="nowrap">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td><td class="nowrap">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>`;
                        } else {
                            nameRow.innerHTML += `<td class="nowrap"><span class="no-data">∅</span></td><td class="nowrap"><span class="no-data">∅</span></td>`;
                        }
                    });
                    fragment.appendChild(nameRow);
                });
                attendanceTable.appendChild(fragment);
            };

            renderTable([], 'all');

            infoBlock.innerHTML = `<p><strong>Legend:</strong></p><p><span class="checkmark">✓</span> Attended <span class="cross">✗</span> Not Attended <span class="no-data">∅</span> Attendance not recorded</p>`;

            const attendanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sortedFormattedDates,
                    datasets: [
                        {
                            label: 'Worship Attendance',
                            data: sortedRawDates.map(date => data.filter(record => record.Date === date && record.WorshipService).length),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Bible Class Attendance',
                            data: sortedRawDates.map(date => data.filter(record => record.Date === date && record.BibleClass).length),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Weeks'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Attendance'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching attendance data:', error);
            spinner.style.display = 'none';
        });
});
