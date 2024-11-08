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

    spinner.style.display = 'block';
    fetch('/api/attendance-difference')
        .then(response => response.json())
        .then(data => {
            spinner.style.display = 'none';
            data.sort((a, b) => a.LastName.localeCompare(b.LastName));

            const uniqueNames = new Set();
            const uniqueDates = new Set();
            const memberRecordsMap = new Map();

            data.forEach(record => {
                const name = `${record.LastName}, ${record.FirstName}`;
                uniqueNames.add(name);
                uniqueDates.add(new Date(record.Date).toLocaleDateString());

                if (!memberRecordsMap.has(name)) {
                    memberRecordsMap.set(name, []);
                }
                memberRecordsMap.get(name).push(record);
            });

            const totalWeeks = uniqueDates.size;
            const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));

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
                const worshipPercentage = totalWeeks ? (worshipCount / totalWeeks * 100).toFixed(2) : 0;
                const bibleClassPercentage = worshipCount ? (bibleClassCount / worshipCount * 100).toFixed(2) : 0;
                return { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount, totalRecords: records.length };
            };

            const filterDataByAttendance = (data, criteria) => {
                return Array.from(memberRecordsMap.entries()).filter(([name, records]) => {
                    const { worshipPercentage } = calculateAttendance(records);
                    if (criteria === 'high') return worshipPercentage >= 75;
                    if (criteria === 'medium') return worshipPercentage >= 50 && worshipPercentage < 75;
                    if (criteria === 'low') return worshipPercentage < 50;
                    return true; // 'all' criteria
                }).map(([name]) => name);
            };

            const renderTable = (selectedMembers, worshipFilterCriteria = 'all') => {
                attendanceTable.innerHTML = '';
                const filteredNames = filterDataByAttendance(data, worshipFilterCriteria);

                const fragment = document.createDocumentFragment();
                let altBg = true;
                const dateHeaderRow = document.createElement('tr');
                const serviceHeaderRow = document.createElement('tr');
                dateHeaderRow.innerHTML = `<th>Name</th>`;
                serviceHeaderRow.innerHTML = `<th></th>`;
                sortedDates.forEach(date => {
                    altBg = !altBg;
                    dateHeaderRow.innerHTML += `<th colspan="2" class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${date}</th>`;
                    serviceHeaderRow.innerHTML += `<th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Worship</th><th class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">Class</th>`;
                });
                fragment.appendChild(dateHeaderRow);
                fragment.appendChild(serviceHeaderRow);

                const totalAttendanceRow = document.createElement('tr');
                totalAttendanceRow.innerHTML = `<td></td>`;
                sortedDates.forEach(date => {
                    const totalWorshipAttendees = data.filter(record => new Date(record.Date).toLocaleDateString() === date && record.WorshipService).length;
                    const totalBibleClassAttendees = data.filter(record => new Date(record.Date).toLocaleDateString() === date && record.BibleClass).length;
                    totalAttendanceRow.innerHTML += `<td class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${totalWorshipAttendees}</td><td class="date-header ${altBg ? 'alt-bg-1' : 'alt-bg-2'}">${totalBibleClassAttendees}</td>`;
                });
                fragment.appendChild(totalAttendanceRow);

                filteredNames.forEach((name, index) => {
                    const records = memberRecordsMap.get(name);
                    const { worshipPercentage, bibleClassPercentage, worshipCount, bibleClassCount } = calculateAttendance(records);
                    let worshipColor = 'red';
                    if (worshipPercentage >= 75) worshipColor = 'green';
                    else if (worshipPercentage >= 50) worshipColor = 'rgb(185, 92, 6)';
                    let bibleClassColor = 'red';
                    if (bibleClassPercentage >= 75) bibleClassColor = 'green';
                    else if (bibleClassPercentage >= 50) bibleClassColor = 'rgb(185, 92, 6)';
                    if (selectedMembers.length === 0 || selectedMembers.includes(name)) {
                        const nameRow = document.createElement('tr');
                        nameRow.classList.add(index % 2 === 0 ? 'row-bg-1' : 'row-bg-2');
                        nameRow.innerHTML = `<td class="nowrap"><span class="name">${name}</span><br>${worshipCount} Worships <span style="color:${worshipColor}">${worshipPercentage}%</span> - ${bibleClassCount} Bible Classes <span style="color:${bibleClassColor}">${bibleClassPercentage}%</span></td>`;
                        sortedDates.forEach(date => {
                            const record = records.find(record => new Date(record.Date).toLocaleDateString() === date);
                            if (record) {
                                nameRow.innerHTML += `<td class="nowrap">${record.WorshipService ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td><td class="nowrap">${record.BibleClass ? '<span class="checkmark">✓</span>' : '<span class="cross">✗</span>'}</td>`;
                            } else {
                                nameRow.innerHTML += `<td class="nowrap"><span class="no-data">∅</span></td><td class="nowrap"><span class="no-data">∅</span></td>`;
                            }
                        });
                        fragment.appendChild(nameRow);
                    }
                });
                attendanceTable.appendChild(fragment);
            };

            renderTable([], 'all');

            attendanceFilter.addEventListener('change', () => {
                const worshipCriteria = attendanceFilter.value;
                renderTable(Array.from(memberSelect.selectedOptions).map(option => option.value), worshipCriteria);
            });

            memberSelect.addEventListener('change', () => {
                const selectedOptions = Array.from(memberSelect.selectedOptions).map(option => option.value);
                renderTable(selectedOptions, attendanceFilter.value);
            });

            clearSelectionButton.addEventListener('click', () => {
                memberSelect.selectedIndex = -1;
                renderTable([], attendanceFilter.value);
            });

            infoBlock.innerHTML = `<p><strong>Legend:</strong></p><p><span class="checkmark">✓</span> Attended <span class="cross">✗</span> Not Attended <span class="no-data">∅</span> Attendance not recorded</p>`;

            const attendanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sortedDates,
                    datasets: [
                        {
                            label: 'Worship Attendance',
                            data: sortedDates.map(date => data.filter(record => new Date(record.Date).toLocaleDateString() === date && record.WorshipService).length),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Bible Class Attendance',
                            data: sortedDates.map(date => data.filter(record => new Date(record.Date).toLocaleDateString() === date && record.BibleClass).length),
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