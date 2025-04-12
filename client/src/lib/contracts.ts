import Web3 from 'web3';
import { getWeb3 } from './web3';

// ABI for the InvestmentContract
const investmentContractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_startupAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_investorAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "investor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "milestoneIndex",
        "type": "uint256"
      }
    ],
    "name": "MilestoneCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "investor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "startup",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "MilestoneCreated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getInvestor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getMilestone",
    "outputs": [
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCompleted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMilestonesCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStartup",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "investorAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "addMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "releaseMilestonePayment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startupAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Simplified contract bytecode for deployment - this would be the compiled contract bytecode in production
const investmentContractBytecode = '0x608060405234801561001057600080fd5b5060405161085038038061085083398101604081905261002f91610054565b600080546001600160a01b03199081166001600160a01b039485161790915560018054929094169216919091179055610084565b6000806040838503121561006757600080fd5b82516001600160a01b038116811461007e57600080fd5b9350602090920151949350505050565b6107bd806100936000396000f3fe6080604052600060045534801561001557600080fd5b50600436106100a95760003560e01c80638da5cb5b116100715780638da5cb5b146101105780639504bd281461013057608051610155578063d23f11161461015d578063e13abc8e14610170578063e4b50cb81461017857600080fd5b806312065fe0146100ae57806339b0d527146100cc5780634fbe977c146100d45780635ba7e312146100dc57806381e1a4fd146100fd575b600080fd5b6100b6610198565b6040516100c3919061059c565b60405180910390f35b6100d46101a1565b005b6100d46101ec565b6100ea6102a5565b6040516100c3929190610615565b6100d461010b366004610646565b61030e565b6000546100ea906001600160a01b031681565b6001546001600160a01b03166100ea565b6100d461016b366004610646565b610459565b6100b66105a5565b6100ea610186366004610646565b6105ae565b4790565b6001546001600160a01b031633146101e95760405162461bcd60e51b815260206004820152600c60248201526b155b985d5d1a1bdc9a5e995960a21b60448201526064015b60405180910390fd5b565b6001546001600160a01b031633146102345760405162461bcd60e51b815260206004820152600c60248201526b155b985d5d1a1bdc9a5e995960a21b60448201526064016101e0565b60025460005b8181101561026f576002818154811061025457610254610680565b600091825260209091206003909102015460ff161561026d57600101610239565b505b60005b600454811015610280576004548110156102a257604051806040016040528060078152602001664d696c65312d3160c81b8152506020013481526020016000151581525060029080518254600181810184557f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace01805491519092839283927fc877f7abae8c3cf85de5e7ed208a6e31a5633b35f79280997506bc03cd479cbc929091019060ff16908114156103dd576020915083908390600080516020610768833981519152855460018101808755957ff3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee389600703900a926002027ff3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee49390910193909355541661046357506102a2565b60008a9150505b600182016000905561046357600191909101906103ed565b61046b915050565b9181845260208651818601528460405160009261058c575b505050565b5050505050505050610573565b6001546001600160a01b031633146104a15760405162461bcd60e51b815260206004820152600c60248201526b155b985d5d1a1bdc9a5e995960a21b60448201526064016101e0565b60006002828154811061041f5761041f610582565b9050825160008083815460018181018087557fa65a81fbc008d7b790975b3cee99e40d238a9621d45c7f8c3bf7911579b77268600502018054845173ffffffffffffffffffffffffffffffffffffffff9d83166101009490940a81810219909316979097179095551681526020810184905260400191835290549260ff1690866104249089906105a557837ff3f7a9fe364faab93b216da50a3214154f22a0a2b415b23a84c8169e8b636ee39290910193909355541661046357506102a2565b600280548291600091829081106104d2576104d2610680565b600091825260209091206003909102018054919250908061061d5750604051806060016040528060008152602001600081526020016000151581525060029080518254600181810184557f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace0180549151909283928392918290821981841693909301831682880217835573ffffffffffffffffffffffffffffffffffffffff871660a481811c911680156105255783811660c01c1692505b600283101561053c57601f8111156105365783905290505b601f01901361056d578190049091925b8254921561055f578490526105005761045f565b8554908401610533565b81529085900390910190610544565b92610524565b9094925050565b80548110156105915750919050565b50919050565b9081526020016000f35b90815260200190565b60025490565b600281815481106105be57600080fd5b6000918252602090912060039091020180546001820154600290920154909260ff1683565b6001600160a01b03821681526020810160148301369050919050565b634e487b7160e01b600052603260045260246000fd5b60006020828403121561065857600080fd5b5035919050565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052603160045260246000fdfe2c6572692273746174654d75746162696c6974793a2063616c6c6572206d75737420626520616e206163746976652070726f706f736561c2646970667358221220dbaed4b8d1b15e216b9f3eb8ec3b3a8b9c0af3e61f64da878dce89e60e5bdef164736f6c63430008120033';

// Function to deploy a new investment contract
export const deployInvestmentContract = async (
  startupAddress: string,
  investorAddress: string
): Promise<string | null> => {
  try {
    const web3 = getWeb3();
    
    // Check if MetaMask is available and connected
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      console.error('MetaMask not available');
      return null;
    }
    
    // Request accounts from MetaMask
    await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    
    // Get the first account (current user)
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];
    
    if (!from) {
      console.error('No accounts available');
      return null;
    }
    
    // Create contract instance
    const contract = new web3.eth.Contract(investmentContractABI as any);
    
    // Deploy the contract
    const deployTx = contract.deploy({
      data: investmentContractBytecode,
      arguments: [startupAddress, investorAddress]
    });
    
    const gas = await deployTx.estimateGas({ from });
    
    // Deploy with gas estimation
    const deployedContract = await deployTx.send({
      from,
      gas
    });
    
    return deployedContract.options.address;
  } catch (error) {
    console.error('Error deploying contract:', error);
    return null;
  }
};

// Function to get an existing contract instance
export const getInvestmentContract = (contractAddress: string) => {
  const web3 = getWeb3();
  return new web3.eth.Contract(investmentContractABI as any, contractAddress);
};

// Function to add a milestone to the contract
export const addMilestone = async (
  contractAddress: string,
  description: string,
  amount: string // in wei
): Promise<boolean> => {
  try {
    const web3 = getWeb3();
    const contract = getInvestmentContract(contractAddress);
    
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];
    
    await contract.methods.addMilestone(description, amount).send({ from });
    return true;
  } catch (error) {
    console.error('Error adding milestone:', error);
    return false;
  }
};

// Function to deposit funds to the contract
export const depositToContract = async (
  contractAddress: string,
  amount: string // in wei
): Promise<boolean> => {
  try {
    const web3 = getWeb3();
    const contract = getInvestmentContract(contractAddress);
    
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];
    
    await contract.methods.deposit().send({ from, value: amount });
    return true;
  } catch (error) {
    console.error('Error depositing to contract:', error);
    return false;
  }
};

// Function to release milestone payment
export const releaseMilestonePayment = async (
  contractAddress: string,
  milestoneIndex: number
): Promise<boolean> => {
  try {
    const web3 = getWeb3();
    const contract = getInvestmentContract(contractAddress);
    
    const accounts = await web3.eth.getAccounts();
    const from = accounts[0];
    
    await contract.methods.releaseMilestonePayment(milestoneIndex).send({ from });
    return true;
  } catch (error) {
    console.error('Error releasing milestone payment:', error);
    return false;
  }
};

// Function to get contract balance
export const getContractBalance = async (contractAddress: string): Promise<string> => {
  try {
    const contract = getInvestmentContract(contractAddress);
    const balance = await contract.methods.getBalance().call();
    return balance;
  } catch (error) {
    console.error('Error getting contract balance:', error);
    return '0';
  }
};

// Function to get all milestones from a contract
export const getMilestones = async (contractAddress: string): Promise<Array<{
  description: string;
  amount: string;
  isCompleted: boolean;
}>> => {
  try {
    const contract = getInvestmentContract(contractAddress);
    const count = await contract.methods.getMilestonesCount().call();
    
    const milestones = [];
    for (let i = 0; i < parseInt(count); i++) {
      const milestone = await contract.methods.getMilestone(i).call();
      milestones.push({
        description: milestone.description,
        amount: milestone.amount,
        isCompleted: milestone.isCompleted
      });
    }
    
    return milestones;
  } catch (error) {
    console.error('Error getting milestones:', error);
    return [];
  }
};