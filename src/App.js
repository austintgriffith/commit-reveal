import React, { Component } from 'react';
import './App.css';
import { Metamask, Gas, ContractLoader, Transactions, Events, Scaler, Blockie, Address, Button } from "dapparatus"
import Web3 from 'web3';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: false,
      account: false,
      gwei: 4,
      doingTransaction: false,
    }
  }
  async handleInput(e){
    let update = {}
    update[e.target.name] = e.target.value
    if(update['pres']){
      let bytes = this.state.web3.utils.utf8ToHex(update['pres'])
      update.salt = this.state.web3.utils.sha3(""+Math.random())
      update.hash = await this.state.contracts.CommitReveal.getSaltedHash(bytes,update.salt).call()
    }
    this.setState(update)
  }
  render() {
    let {web3,account,contracts,tx,gwei,block,avgBlockTime,etherscan} = this.state
    let connectedDisplay = []
    let contractsDisplay = []
    if(web3){
      connectedDisplay.push(
        <Gas
        key="Gas"
        onUpdate={(state)=>{
          console.log("Gas price update:",state)
          this.setState(state,()=>{
            console.log("GWEI set:",this.state)
          })
        }}
        />
      )
      connectedDisplay.push(
        <ContractLoader
        key="ContractLoader"
        config={{DEBUG:true}}
        web3={web3}
        require={path => {return require(`${__dirname}/${path}`)}}
        onReady={(contracts,customLoader)=>{
          console.log("contracts loaded",contracts)
          this.setState({contracts:contracts},async ()=>{
            console.log("Contracts Are Ready:",this.state.contracts)
          })
        }}
        />
      )
      connectedDisplay.push(
        <Transactions
        key="Transactions"
        config={{DEBUG:false}}
        account={account}
        gwei={gwei}
        web3={web3}
        block={block}
        avgBlockTime={avgBlockTime}
        etherscan={etherscan}
        onReady={(state)=>{
          console.log("Transactions component is ready:",state)
          this.setState(state)
        }}
        onReceipt={(transaction,receipt)=>{
          // this is one way to get the deployed contract address, but instead I'll switch
          //  to a more straight forward callback system above
          console.log("Transaction Receipt",transaction,receipt)
        }}
        />
      )
      if(contracts){

        let reveals = []
        for(let e in this.state.revealEvents){
          reveals.push(
            <span style={{color:"#FFFFFF",padding:5}}>
            {this.state.revealEvents[e].random}
            </span>
          )
        }

        let answers = []
        for(let e in this.state.revealedAnswers){
          answers.push(
            <div style={{color:"#FFFFFF",padding:5}}>
            <Blockie
            address={this.state.revealedAnswers[e].sender.toLowerCase()}
            config={{size:3}}
            />
            <span style={{padding:5}}>
            {this.state.web3.utils.hexToUtf8(this.state.revealedAnswers[e].answer)}
            </span>
            </div>
          )
        }

        contractsDisplay.push(
          <div key="UI" style={{padding:30}}>
          <div>
          <Address
          {...this.state}
          address={contracts.CommitReveal._address}
          />
          </div>
          <Button size="2" onClick={async ()=>{
            let reveal = this.state.web3.utils.sha3(""+Math.random())
            let commit = await contracts.CommitReveal.getHash(reveal).call()
            this.setState({reveal:reveal})
            tx(contracts.CommitReveal.commit(commit),120000,0,0,(receipt)=>{
              if(receipt){
                console.log("COMMITTED:",receipt)
              }
            })
          }}>
          Commit
          </Button>
          <Events
          config={{hide:false}}
          contract={contracts.CommitReveal}
          eventName={"CommitHash"}
          block={block}
          onUpdate={(eventData,allEvents)=>{
            console.log("EVENT DATA:",eventData)
            this.setState({commitEvents:allEvents})
          }}
          />
          <Button size="2" onClick={async ()=>{
            tx(contracts.CommitReveal.reveal(this.state.reveal),120000,0,0,(receipt)=>{
              if(receipt){
                console.log("REVEALED:",receipt)
              }
            })
          }}
          >
          Reveal
          </Button>
          <Events
          config={{hide:false}}
          contract={contracts.CommitReveal}
          eventName={"RevealHash"}
          block={block}
          onUpdate={(eventData,allEvents)=>{
            console.log("EVENT DATA:",eventData)
            this.setState({revealEvents:allEvents})
          }}
          />
          {reveals}

          <div>Who was the 42nd President of the United States?</div>
          <input
          style={{verticalAlign:"middle",width:200,margin:6,maxHeight:20,padding:5,border:'2px solid #ccc',borderRadius:5}}
          type="text" name="pres" value={this.state.pres} onChange={this.handleInput.bind(this)}
          />
          <div>
          Salt: {this.state.salt}
          </div>
          <div>
          Hash: {this.state.hash}
          </div>
          <Button size="2" onClick={async ()=>{
            tx(contracts.CommitReveal.commit(this.state.hash),120000,0,0,(receipt)=>{
              if(receipt){
                console.log("COMMITTED:",receipt)
              }
            })
          }}>
          Commit
          </Button>
          <Button size="2" onClick={async ()=>{
            tx(contracts.CommitReveal.revealAnswer(this.state.web3.utils.utf8ToHex(this.state.pres),this.state.salt),120000,0,0,(receipt)=>{
              if(receipt){
                console.log("REVEALED:",receipt)
              }
            })
          }}
          >
          Reveal Answer
          </Button>
          <Events
          config={{hide:false}}
          contract={contracts.CommitReveal}
          eventName={"RevealAnswer"}
          block={block}
          onUpdate={(eventData,allEvents)=>{
            console.log("EVENT DATA:",eventData)
            this.setState({revealedAnswers:allEvents})
          }}
          />
          {answers}
          </div>
        )
      }
    }
    return (
      <div className="App">
      <Metamask
      config={{requiredNetwork:['Unknown','Rinkeby']}}
      onUpdate={(state)=>{
        console.log("metamask state update:",state)
        if(state.web3Provider) {
          state.web3 = new Web3(state.web3Provider)
          this.setState(state)
        }
      }}
      />
      {connectedDisplay}
      {contractsDisplay}
      </div>
    );
  }
}

export default App;
