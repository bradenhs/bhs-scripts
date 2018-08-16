const contentContainer = document.createElement("div");
document.body.appendChild(contentContainer);
contentContainer.innerHTML = "Loading...";

fetch(process.env.API_SERVER_LOCATION).then(response => {
  response.text().then(text => {
    contentContainer.innerHTML = `<b>Server says</b>: ${text}`;
  });
});
