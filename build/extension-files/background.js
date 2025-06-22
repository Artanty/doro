chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === "my-channel");
  port.onMessage.addListener((msg) => {
    console.log("Received message from app:", msg);
  });
});