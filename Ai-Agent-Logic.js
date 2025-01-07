document.addEventListener("DOMContentLoaded", () => {
  console.log("Chatbot initialized.");

  // Fetch and inject the HTML template
  fetch('https://cdn.jsdelivr.net/gh/dmt49/SIX-AI/Ai-Agent-UI.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('ai-agent-wrapper').innerHTML = html;
      console.log("HTML template loaded.");

      // Reinitialize DOM element references after HTML is loaded
      initializeChatbot();
    })
    .catch(error => console.error("Error loading HTML template:", error));
});

// Chatbot initialization function
function initializeChatbot() {
  console.log("Initializing chatbot...");

  const textarea = document.getElementById("chat-user-input");
  const micButton = document.getElementById("chat-user-input-mic");
  const userSubmit = document.getElementById("chat-user-submit");
  const hiddenDiv = document.getElementById("hidden-div");
  const conversationWrapper = document.getElementById("chat_conversation-wrapper");
  const chatInputWrapper = document.querySelector(".chat_input-wrapper");

  // Check if all necessary elements exist
  if (!textarea || !micButton || !userSubmit || !hiddenDiv || !conversationWrapper || !chatInputWrapper) {
    console.error("Required DOM elements are missing. Chatbot cannot initialize.");
    return;
  }

  // Hide input UI on load
  chatInputWrapper.style.display = "none";
  console.log("Input wrapper hidden on load.");

  // Attach event listeners to DOM elements
  textarea.addEventListener("input", () => adjustHeight(hiddenDiv, textarea));
  userSubmit.addEventListener("click", () => handleSubmit(textarea, conversationWrapper));

  textarea.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(textarea, conversationWrapper);
    }
  });

  micButton.addEventListener("click", toggleVoiceRecognition);

  // Start initial conversation
  if (typeof window.startInitialConversation === "function") {
    window.startInitialConversation(conversationWrapper, chatInputWrapper);
  } else {
    console.error("startInitialConversation function not found. Make sure it is globally defined.");
  }
}

// Adjust textarea height dynamically
function adjustHeight(hiddenDiv, textarea) {
  hiddenDiv.textContent = textarea.value + "\u200b";
  textarea.style.height = hiddenDiv.offsetHeight + "px";
}

// Handle user message submission
async function handleSubmit(textarea, conversationWrapper) {
  const message = textarea.value.trim();
  if (!message) return;

  createChatBlock(true, message, conversationWrapper);
  resetTextarea(textarea);

  const loadingBlock = createLoadingBlock(conversationWrapper);
  const agentResponse = await startConversation(message);
  conversationWrapper.removeChild(loadingBlock);

  createChatBlock(false, agentResponse, conversationWrapper);
}

// Reset textarea after message submission
function resetTextarea(textarea) {
  textarea.value = "";
  textarea.style.height = "30px";
}

// Create a chat block (user or bot)
function createChatBlock(isUser, content, conversationWrapper) {
  const chatBlockWrapper = document.createElement("div");
  chatBlockWrapper.className = "chat_block-wrapper";

  const chatBlock = document.createElement("div");
  chatBlock.className = "chat_block";
  chatBlock.textContent = content;

  chatBlockWrapper.appendChild(chatBlock);
  conversationWrapper.appendChild(chatBlockWrapper);
}

// Create a loading block
function createLoadingBlock(conversationWrapper) {
  const chatBlockWrapper = document.createElement("div");
  chatBlockWrapper.className = "chat_block-wrapper";

  const chatBlock = document.createElement("div");
  chatBlock.className = "chat_block";
  chatBlock.textContent = "Loading...";

  chatBlockWrapper.appendChild(chatBlock);
  conversationWrapper.appendChild(chatBlockWrapper);

  return chatBlockWrapper;
}

// Start a conversation with the AI
async function startConversation(message) {
  const region = "bcbe5a"; // Replace with your region
  const projectId = "c5bf489c1af9-4886-afba-073965a5ad71"; // Replace with your project ID
  const apiKey = "sk-MGJlOWM0NGEtMjgyNC00MTIwLTg5NGUtN2IwMzljMmNjNDgx"; // Replace with your API key
  const agentId = "6a12b1cd-b7d5-4b00-80ee-d2829af810dc"; // Replace with your agent ID

  const authorizationToken = `Basic ${btoa(`${projectId}:${apiKey}`)}`;
  const baseUrl = `https://api-${region}.stack.tryrelevance.com/latest`;
  const headers = {
    Authorization: authorizationToken,
    "Content-Type": "application/json",
  };

  try {
    const requestBody = {
      message: { role: "user", content: message },
      agent_id: agentId,
    };

    const response = await fetch(`${baseUrl}/agents/trigger`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      const { studio_id, job_id } = data.job_info;
      return await pollAgentResponse(baseUrl, studio_id, job_id, headers);
    } else {
      const errorData = await response.json();
      console.error("Error starting conversation:", errorData);
      return `Error: ${errorData.message || response.statusText}`;
    }
  } catch (error) {
    console.error("Error during conversation:", error);
    return "An error occurred while contacting the AI.";
  }
}

// Poll for AI response
async function pollAgentResponse(baseUrl, studio_id, job_id, headers) {
  const pollUrl = `${baseUrl}/studios/${studio_id}/async_poll/${job_id}`;
  let done = false;

  while (!done) {
    try {
      const response = await fetch(pollUrl, { method: "GET", headers: headers });
      if (response.ok) {
        const data = await response.json();
        for (const update of data.updates) {
          if (update.type === "chain-success" && update.output.status === "complete") {
            done = true;
            return update.output.output.answer;
          }
        }
      } else {
        console.error("Polling error:", response.statusText);
        return "Error while polling for response.";
      }
    } catch (error) {
      console.error("Polling error:", error);
      return "Error while polling for response.";
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
  }
}

// Start the initial conversation
window.startInitialConversation = function startInitialConversation(conversationWrapper, chatInputWrapper) {
  console.log("Starting initial conversation...");

  const initialMessage = "Hello, how can I help you today?";
  createChatBlock(false, initialMessage, conversationWrapper);

  // Show the input UI after the initial message
  chatInputWrapper.style.display = "grid";
  console.log("Input wrapper displayed.");
};

// Placeholder for voice recognition toggle
function toggleVoiceRecognition() {
  console.log("Voice recognition toggled (placeholder).");
}
