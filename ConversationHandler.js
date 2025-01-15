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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return diffHours > 1 ? `${diffHours} hours ago` : `just now`;
    }
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    return diffWeeks > 1 ? `${diffWeeks} weeks ago` : '1 week ago';
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
          const timeA = new Date(a.fields['Time-Stamp']);
          const timeB = new Date(b.fields['Time-Stamp']);
          return timeB - timeA;
        });

        sortedRecords.forEach((record) => {
          const timeStamp = record.fields['Time-Stamp'];
          const conversationId = record.fields['Conversation-ID'];
          const clientName = record.fields['Client-Name'] || ''; // Leave blank if missing
          const conversationDate = new Date(timeStamp).toLocaleDateString();

          const conversationItem = document.createElement('div');
          conversationItem.className = 'conversation-item';
          conversationItem.innerHTML = `
            <p>
              ${conversationDate} - 
              <span style="color: #117BB8;">${clientName}</span>
            </p>
          `;

          conversationItem.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('conversationID', conversationId);
            window.location.href = currentUrl.toString();
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
