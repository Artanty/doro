function callbackOnEachNode (nodes, callback) {
    if (nodes.length) {
        Array.prototype.forEach.call(nodes, function(node) {
            callback(node)
        })
    }
}

function hideEmptyParametersInsideNode (node) {
    setTimeout(() => {
        const p = node.querySelector('.opblock-body .opblock-section .opblock-description-wrapper p')
        if (p && p.innerText === 'No parameters') {
            callbackOnEachNode(document.getElementsByClassName('parameters-container'), (e) => e.classList.add('d-none'))
            callbackOnEachNode(document.getElementsByClassName('tab-header'), (e) => e.classList.add('op-0'))
        }
    },100)
}

const target = document.querySelector('body')
const expandApiObserver = new MutationObserver(mutationRecords => {
    Array.prototype.forEach.call(mutationRecords,function(mr) {
        if (mr.addedNodes.length){
            for (let i = 0; i < mr.addedNodes.length; i++) {
                const node = mr.addedNodes[i]
                if (node.nodeType !== Node.TEXT_NODE && node.classList.contains('no-margin')){
                    hideEmptyParametersInsideNode(node)
                }
            }
        }
    })
});

expandApiObserver.observe(target, {
    childList: true, // наблюдать за непосредственными детьми
    subtree: true, // и более глубокими потомками
    attributes: true
});

function detectEmptyPrameters () {
    const nodes = document.getElementsByClassName('no-margin')
    if (nodes) {
        Array.prototype.forEach.call(nodes, function(node) {
            hideEmptyParametersInsideNode(node)
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => detectEmptyPrameters(), 100)
    setTimeout(() => detectEmptyPrameters(), 1000)
})







