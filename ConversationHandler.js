(async () => {
  // Step 1: Retrieve user's email
  const userEmail = '%%EMAIL%%';

  // Step 2: Define Airtable API URLs and headers
  const clientsTableUrl = 'https://api.airtable.com/v0/app2N6x5jeRnIzSpL/clients';
  const conversationsTableUrl = 'https://api.airtable.com/v0/app2N6x5jeRnIzSpL/conversations';
  const headers = {
    Authorization: 'Bearer patTeuxUuzgG0ZU8Q.2eb9ff7f31afe3e06f3c128c5b5b832bcc4e4e85bd58a5007a8368f218d28b83',
    'Content-Type': 'application/json'
  };

  // Function to calculate relative time
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
    // Step 3: Fetch User ID from Clients table
    const clientsResponse = await fetch(`${clientsTableUrl}?filterByFormula=({Email}='${userEmail}')`, { headers });
    const clientsData = await clientsResponse.json();

    if (clientsData.records && clientsData.records.length > 0) {
      const userId = clientsData.records[0].fields['User-ID'];

      // Step 4: Fetch matching conversations from Conversations table
      const conversationsResponse = await fetch(
        `${conversationsTableUrl}?filterByFormula=AND({user-ID}='${userId}', {Agent-ID}='a60e7386-b17c-43b8-9a37-6d68eeb88eef')`,
        { headers }
      );
      const conversationsData = await conversationsResponse.json();

      // Step 5: Populate conversation list dynamically
      const listWrapper = document.getElementById('conversation-list-wrapper');
      listWrapper.innerHTML = ''; // Clear previous content

      if (conversationsData.records && conversationsData.records.length > 0) {
        // Sort records by Time-Stamp in descending order
        const sortedRecords = conversationsData.records.sort((a, b) => {
          const timeA = new Date(a.fields['Time-Stamp']);
          const timeB = new Date(b.fields['Time-Stamp']);
          return timeB - timeA; // Descending order
        });

        sortedRecords.forEach(record => {
          const timeStamp = record.fields['Time-Stamp'];
          const conversationId = record.fields['Conversation-ID'];
          const conversationDate = new Date(timeStamp).toLocaleDateString(); // Format as date
          const relativeTime = getRelativeTime(timeStamp);

          // Create conversation element
          const conversationItem = document.createElement('div');
          conversationItem.className = 'conversation-item';
          conversationItem.innerHTML = `
            <p>${conversationDate}</p>
            <p>${relativeTime}</p>
          `;

          // Add click event to redirect with query parameter
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
    }
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
})();
