import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import FreelanceMarketplaceV2 from "../contracts/FreelanceMarketplaceV2.json";

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0.0");
  const [contract, setContract] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        setIsLoading(true);
        const web3Provider = new BrowserProvider(window.ethereum);
        
        // Request account access
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const currentAccount = accounts[0];
        
        const web3Signer = await web3Provider.getSigner();
        
        // Get network instance
        const networkId = await web3Provider.getNetwork().then(n => n.chainId.toString());
        
        // Enforce Truffle connection (1337) to fix "missing jobs" due to Ganache mismatch
        if (networkId !== "1337" && networkId !== "5777") {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x539' }], // 1337
            });
            return; // Exit here, page will reload via chainChanged listener
          } catch (switchError) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x539',
                    chainName: 'Ganache Local',
                    rpcUrls: ['http://127.0.0.1:7545'],
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
                  }],
                });
                return;
              } catch (addError) {
                console.error("Failed to add Ganache network:", addError);
              }
            }
          }
        }

        const networkData = FreelanceMarketplaceV2.networks[networkId] || FreelanceMarketplaceV2.networks["5777"]; // fallback to Ganache
        
        if (networkData) {
          // Verify if contract actually exists on the connected RPC
          let code = "0x";
          try {
            code = await web3Provider.getCode(networkData.address);
          } catch (e) {
            console.warn("Could not check contract code, ignoring...", e);
            code = "skip"; // Bypass check if MetaMask throws transient RPC errors
          }
          
          if (code === "0x") {
            setError("Contract not found! MetaMask is connected to an empty network (likely port 9545 or 8545). Please open MetaMask settings and change the RPC URL for Localhost to http://127.0.0.1:7545");
            setIsLoading(false);
            return;
          }

          const contractInstance = new Contract(
            networkData.address,
            FreelanceMarketplaceV2.abi,
            web3Signer
          );
          
          setProvider(web3Provider);
          setSigner(web3Signer);
          setAccount(currentAccount);
          setContract(contractInstance);
          
          // Fetch balance
          const bal = await web3Provider.getBalance(currentAccount);
          const balInEth = (Number(bal) / 1e18).toFixed(4); // simple conversion to ETH
          setBalance(balInEth);
          setError("");
        } else {
          setError("Smart contract not deployed to detected network.");
        }
      } else {
        setError("Please install MetaMask!");
      }
    } catch (err) {
      console.error(err);
      
      // If MetaMask throws the rate-limit RPC error locally, give specific advice
      if (err.message && err.message.includes("-32002")) {
        setError("MetaMask is stabilizing its connection to the local RPC. Please wait 10 seconds and try again.");
      } else {
        setError("Failed to connect wallet: " + (err.shortMessage || err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Reconnect to refresh signer/contract/balance with new account
          connectWallet();
        } else {
          setAccount("");
          setBalance("0.0");
          setSigner(null);
          setContract(null);
        }
      });
      
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

      // Optionally auto-connect if already connected
      window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        balance,
        contract,
        error,
        isLoading,
        connectWallet,
        isClient,
        setIsClient
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
