async function checkClientId(request, response) {
    const clientId = request.body.clientId;
    console.log(clientId)
    const foundClient = clients.find((el) => el.id === clientId)
    if (foundClient) {
        return response.json({clientId: clientId, verified: true})
    } else {
        return response.json({clientId: clientId, verified: false})
    }
}
app.post('/checkClientId', checkClientId);