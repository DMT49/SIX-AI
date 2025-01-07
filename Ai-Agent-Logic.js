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
  if (typeof startInitialConversation === "function") {
    startInitialConversation(conversationWrapper, chatInputWrapper);
  } else {
    console.error("startInitialConversation function not found. Make sure it is defined globally.");
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
  // Replace with your API logic
  return `Response to: ${message}`;
}

// Start the initial conversation
function startInitialConversation(conversationWrapper, chatInputWrapper) {
  console.log("Starting initial conversation...");

  const initialMessage = "Hello, how can I help you today?";
  createChatBlock(false, initialMessage, conversationWrapper);

  // Show the input UI after the initial message
  chatInputWrapper.style.display = "grid";
  console.log("Input wrapper displayed.");
}

// Placeholder for voice recognition toggle
function toggleVoiceRecognition() {
  console.log("Voice recognition toggled (placeholder).");
}
