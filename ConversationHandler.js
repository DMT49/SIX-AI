let userId = null; // Declare userId globally

(async () => {
  const container = document.getElementById('ai-agent-container');
  const userEmail = container.getAttribute('data-user-email');
  const userName = container.getAttribute('data-user-name');
  const agentID = container.getAttribute('data-agent-id');

  const clientsTableUrl = 'https://api.airtable.com/v0/app2N6x5jeRnIzSpL/clients';
  const conversationsTableUrl = 'https://api.airtable.com/v0/app2N6x5jeRnIzSpL/conversations';
  const headers = {
    Authorization: 'Bearer patTeuxUuzgG0ZU8Q.2eb9ff7f31afe3e06f3c128c5b5b832bcc4e4e85bd58a5007a8368f218d28b83',
    'Content-Type': 'application/json',
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const conversationDate = new Date(timestamp);
    const diffMs = now - conversationDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  };

  const formatTime12Hour = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} <span style="font-size: 0.85em;">${period}</span>`;
  };

  try {
    const clientsResponse = await fetch(`${clientsTableUrl}?filterByFormula=SEARCH('${userEmail}', ARRAYJOIN({Email}, ','))`, { headers });
    const clientsData = await clientsResponse.json();

    if (clientsData.records && clientsData.records.length > 0) {
      userId = clientsData.records[0].fields['User-ID'];
      console.log('Retrieved User-ID:', userId);

      const conversationsResponse = await fetch(
        `${conversationsTableUrl}?filterByFormula=AND({user-ID}='${userId}', {Agent-ID}='${agentID}')`,
        { headers }
      );
      const conversationsData = await conversationsResponse.json();

      const listWrapper = document.getElementById('conversation-list-wrapper');
      listWrapper.innerHTML = '';

      if (conversationsData.records && conversationsData.records.length > 0) {
        const sortedRecords = conversationsData.records.sort((a, b) => {
          const timeA = new Date(a.fields['Time-Last-Edited']);
          const timeB = new Date(b.fields['Time-Last-Edited']);
          return timeB - timeA; // Sort descending by Time-Last-Edited
        });

        sortedRecords.forEach((record) => {
          const timeStamp = record.fields['Time-Stamp'];
          const timeLastEdited = record.fields['Time-Last-Edited'];
          const conversationId = record.fields['Conversation-ID'];
          const clientName = record.fields['Client-Name'] || ''; // Leave blank if missing
          const summary = record.fields['Summary'] || 'No summary available'; // Default if summary is missing
          const conversationDate = new Date(timeStamp);
          const formattedDate = conversationDate.toLocaleDateString('en-GB'); // Format as DD/MM/YYYY
          const formattedTime = formatTime12Hour(conversationDate);
          const relativeTime = getRelativeTime(timeLastEdited);

          const conversationItem = document.createElement('div');
          conversationItem.className = 'conversation-item';
          conversationItem.style.padding = '10px'; // Add 10px padding to all sides
          conversationItem.style.cursor = 'pointer'; // Add pointer for hover effect

          conversationItem.innerHTML = `
            <p style="color: #404040; margin: 0;">
              <span style="color: #67b8d9;">${clientName}</span>
              <span>(${relativeTime})</span> - ${formattedDate} ${formattedTime}
            </p>
            <p class="summary-text" style="margin: 5px 0 0; color: #a2a2a2; transition: color 0.3s;">
              ${summary}
            </p>
          `;

          conversationItem.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('conversationID', conversationId);
            window.location.href = currentUrl.toString();
          });

          // Add hover effect to change the summary text color
          conversationItem.addEventListener('mouseenter', () => {
            const summaryText = conversationItem.querySelector('.summary-text');
            summaryText.style.color = '#404040';
          });

          conversationItem.addEventListener('mouseleave', () => {
            const summaryText = conversationItem.querySelector('.summary-text');
            summaryText.style.color = '#a2a2a2';
          });

          listWrapper.appendChild(conversationItem);
        });
      } else {
        listWrapper.innerHTML = '<p>No matching conversations found.</p>';
      }
    } else {
      console.log('No matching user found for email:', userEmail);
      const listWrapper = document.getElementById('conversation-list-wrapper');
      listWrapper.innerHTML = '<p>No matching conversations found.</p>';
    }
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
})();
