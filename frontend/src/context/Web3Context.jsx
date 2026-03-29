import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import FreelanceMarketplaceV2 from "../contracts/FreelanceMarketplaceV2.json";

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

const GANACHE_CHAIN_IDS = ["1337", "5777"];
const GANACHE_CHAIN_HEX = "0x539";

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0.0");
  const [contract, setContract] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const isConnecting = useRef(false);

  const connectWallet = async () => {
    if (isConnecting.current) return;
    isConnecting.current = true;

    try {
      if (!window.ethereum) {
        setError("MetaMask not detected. Please install MetaMask to use this app.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      const web3Provider = new BrowserProvider(window.ethereum);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        setError("No accounts found. Please unlock MetaMask.");
        setIsLoading(false);
        return;
      }
      const currentAccount = accounts[0];

      const network = await web3Provider.getNetwork();
      const networkId = network.chainId.toString();

      if (!GANACHE_CHAIN_IDS.includes(networkId)) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: GANACHE_CHAIN_HEX }],
          });
          return;
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: GANACHE_CHAIN_HEX,
                  chainName: "Ganache Local",
                  rpcUrls: ["http://127.0.0.1:7545"],
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                }],
              });
              return;
            } catch (addError) {
              setError("Could not add Ganache network to MetaMask. Please add it manually (RPC: http://127.0.0.1:7545, Chain ID: 1337).");
              setIsLoading(false);
              return;
            }
          } else if (switchError.code === 4001) {
            setError("Please switch MetaMask to the Ganache Local network (Chain ID: 1337).");
            setIsLoading(false);
            return;
          } else {
            setError("Network switch failed: " + (switchError.message || "Unknown error"));
            setIsLoading(false);
            return;
          }
        }
      }

      const networkData =
        FreelanceMarketplaceV2.networks[networkId] ||
        FreelanceMarketplaceV2.networks["5777"] ||
        FreelanceMarketplaceV2.networks["1337"];

      if (!networkData || !networkData.address) {
        setError("Smart contract not deployed on this network. Run `truffle migrate --reset` and try again.");
        setIsLoading(false);
        return;
      }

      const isLocalNetwork = GANACHE_CHAIN_IDS.includes(networkId);
      let code = "0x";
      try {
        code = await web3Provider.getCode(networkData.address);
      } catch (codeErr) {
        code = isLocalNetwork ? "skip" : "0x";
      }

      if (code === "0x") {
        if (isLocalNetwork) {
          setError(
            `Contract not found at ${networkData.address}. ` +
            "Ganache may have restarted and lost state. " +
            "Run `truffle migrate --reset` in the /blockchain folder, then reconnect."
          );
        } else {
          setError("Contract not found at the deployed address. Please redeploy the contract.");
        }
        setIsLoading(false);
        return;
      }

      const web3Signer = await web3Provider.getSigner();
      const contractInstance = new Contract(
        networkData.address,
        FreelanceMarketplaceV2.abi,
        web3Signer
      );

      const rawBalance = await web3Provider.getBalance(currentAccount);
      const balInEth = parseFloat(formatEther(rawBalance)).toFixed(4);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(currentAccount);
      setContract(contractInstance);
      setBalance(balInEth);
      setError("");
    } catch (err) {
      if (err.code === -32002 || (err.message && err.message.includes("-32002"))) {
        setError("MetaMask is busy. Please open MetaMask and approve the pending request.");
      } else if (err.code === 4001) {
        setError("Connection rejected. Please approve the MetaMask request to continue.");
      } else {
        setError("Failed to connect wallet: " + (err.shortMessage || err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
      isConnecting.current = false;
    }
  };

  const disconnectWallet = () => {
    setAccount("");
    setBalance("0.0");
    setSigner(null);
    setContract(null);
    setProvider(null);
    setError("");
  };

  useEffect(() => {
    if (!window.ethereum) {
      setIsLoading(false);
      return;
    }

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          connectWallet();
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => setIsLoading(false));

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
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
        disconnectWallet,
        isClient,
        setIsClient,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
