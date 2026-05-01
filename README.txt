1.0 INTRODUCTION  
Blockchain technology is a distributed, tamper-resistant ledger that records transactions across a network of nodes without relying on any single controlling authority (Ethereum Foundation, 2023). Because no single party owns or governs the data, it becomes extremely difficult for anyone to alter records without the rest of the network detecting it. Smart contracts build on this foundation as they are programs stored directly on the blockchain that execute automatically once specific conditions are satisfied, removing the need for manual enforcement or third-party verification (Wohrer & Zdun, 2021). When both technologies are combined, the result is a system that is transparent, automated, and resistant to manipulation, which makes it well-suited for financial applications where trust between strangers is required.
Crowdfunding is a method of raising capital by collecting relatively small contributions from a large number of people, usually through an online platform (Statista, 2024). What started as a niche concept in the early 2000s has grown into a multi-billion-dollar industry. ArtistShare (2001) is broadly recognised as the first dedicated platform, followed by Indiegogo (2008) and Kickstarter (2009), both of which brought the model into mainstream awareness. By 2023, global crowdfunding had facilitated over USD 1.4 billion in pledges through Kickstarter alone, and the broader market was valued at approximately USD 1.41 billion globally (Statista, 2024). Despite this growth, the dominant platforms today are still centralised, meaning a private company sits in the middle of every transaction, charges fees, controls fund release, and can freeze or cancel a campaign based on its own internal policies.
For independent filmmakers, this is a particularly painful reality. Film production requires hitting a precise funding target; half a budget is rarely useful. Yet traditional platforms like Kickstarter can withhold funds for extended periods, charge platform and payment processing fees totalling anywhere from 8% to 10%, and offer no real-time visibility into where the money is sitting (Mollick, 2022). A filmmaker with a strong script can run a successful campaign and still end up with less than they expected, later than they needed it.
Decentralised crowdfunding replaces the platform middleman with a smart contract. The contract holds all contributed funds, checks whether the funding goal was reached by the deadline, and then either releases the money to the campaign creator or issues refunds to contributors automatically, without any human involvement (Ante, 2021). Everything is recorded on a public blockchain, meaning any contributor can independently verify the campaign balance, the total raised, and the transaction history at any time. There is no company whose policies you have to trust; the rules are written in the contract code, which is open for anyone to inspect.
LumiFilm is a decentralised application (dApp) built on the Ethereum blockchain specifically for independent filmmakers and small production teams. It allows filmmakers to launch funding campaigns, receive direct ETH contributions from global supporters, and, if the goal is met, withdraw production funds without any platform taking a cut beyond blockchain gas fees. If the goal is not reached, contributors get their money back automatically through the smart contract. Contributors to successful campaigns also receive LUMI, an ERC-20 reward token representing benefits such as film credits, exclusive digital content, or early screening access. The goal of LumiFilm is straightforward: give talented filmmakers a fair, transparent path to funding their work.






Logo 







1.1 Traditional vs. Decentralised Crowdfunding
The differences between the two models are not just technical; they have real practical consequences for both creators and backers.


Feature
Traditional Crowdfunding
Decentralised Crowdfunding (LumiFilm)
Intermediaries
The platform company manages all funds
Smart contract manages funds; no company is involved
Fees
5–10% platform fee + payment processing
Gas fees only (typically < 1%)
Fund Control
The platform holds and releases funds on its schedule
Funds locked in smart contract; released by contract logic
Transparency
Limited; users rely on platform reporting
Fully on-chain; anyone can verify in real time
Refund Speed
Days to weeks, subject to platform policy
Automatic, triggered by contract when deadline passes
Censorship Risk
The platform can suspend or cancel campaigns
No central authority; the contract cannot be overridden




















1.2 Ethereum and Core Technologies
Ethereum was chosen for LumiFilm because it is the most mature and widely supported smart contract platform, with an extensive developer ecosystem and well-established tooling (Ethereum Foundation, 2023). Its Turing-complete virtual machine (the EVM) allows for complex contract logic such as conditional fund release and token distribution, which simpler blockchains cannot support.
The platform makes use of the following core technologies:
Solidity is the primary language for writing Ethereum smart contracts, compiled and deployed to the EVM.
ERC-20 Token Standard used to create the LUMI reward token, a fungible token distributed to contributors of successful campaigns (OpenZeppelin, 2023).
MetaMask a browser-based Ethereum wallet that users connect to the platform in order to sign transactions and verify identity without needing a traditional login system.
Ethers.js a JavaScript library used by the front-end to communicate with deployed smart contracts on the Ethereum testnet.
Hardhat / Remix IDE used for writing, testing, and deploying the Solidity contracts during development.
1.3 Existing Crowdfunding Platforms
Several real-world platforms illustrate both what the traditional model has achieved and where it falls short:
Kickstarter (2009, USA) is the largest reward-based platform globally, widely used for film and creative projects, but charges 5% + payment fees and controls all fund disbursements.
Indiegogo (2008, USA) is similar to Kickstarter, additionally offers flexible funding, but the same fee structure and transparency limitations apply.
GoFundMe (2010, USA) is donation-based, primarily for personal causes; not suitable for structured campaign funding.
Gitcoin is a blockchain-native platform for funding open-source software, demonstrating that decentralised funding models can work at scale (Gitcoin, 2022).
Juicebox Protocol is a decentralised Ethereum-based funding tool used by communities and projects that want programmable treasury management without a central operator.
LumiFilm is positioned between these worlds, bringing the simplicity and visual familiarity of Kickstarter to a fully on-chain, trustless infrastructure suited specifically to independent film.
2.0 Problem Statement
Independent filmmakers are stuck in a difficult position. On one side, producing even a low-budget short film requires a reliable pool of funding; on the other, the channels available to access that funding are either extremely competitive (grants, studio backing) or costly and opaque (traditional crowdfunding platforms). A filmmaker who runs a successful Kickstarter campaign and raises their goal amount can still end up short after platform fees, payment processing charges, and delayed disbursements reduce what they actually receive (Mollick, 2022). For a production with a tight budget, those deductions can be the difference between making the film and not.
The deeper problem is structural. Centralised crowdfunding platforms hold contributors' money and operate as unaccountable intermediaries. There is no way for a backer to independently verify that funds are being managed correctly, that refunds will be processed promptly in a failed campaign, or that the platform itself will not change its terms mid-campaign. In 2023, several high-profile cases of delayed or denied withdrawals on traditional platforms highlighted just how much creator and contributor trust depends on a third party behaving as promised (Statista, 2024).
For the independent film community, specifically where production timelines are tight and financial trust between creators and supporters matters enormously, a system that enforces its own rules through code rather than relying on a company's goodwill is not just preferable, it is necessary.
LumiFilm addresses these problems by replacing the platform intermediary with Ethereum smart contracts, ensuring that fund management, refund processing, and reward distribution are handled automatically, transparently, and without any party being able to interfere with the process.
Independent filmmakers with outstanding scripts often cannot produce their films due to high funding barriers and limited access to capital.

Traditional crowdfunding platforms charge high fees, lack transparency, delay fund release, and offer no reliable way for talented indie filmmakers to secure production money for promising projects.

3.0 Policy / Business Rules
LumiFilm is a blockchain-based crowdfunding dApp for independent film production. The following policies and rules govern how the platform operates.
Policies
Transparency: Every campaign created, every contribution made, and every withdrawal or refund processed is recorded permanently on the Ethereum blockchain. This means the full financial history of any campaign is publicly visible and verifiable by any participant, at any time, without needing to request it from a platform operator.
Security: All fund management is handled by deployed smart contracts, not by any individual or company. Contributors' ETH is held within the contract until the campaign resolves; no person has the ability to move those funds outside of the rules written in the contract logic.
All-or-Nothing Funding LumiFilm enforces a strict goal-based model. If a campaign does not reach its target by the deadline, it is marked as failed, and all contributors can claim full refunds. Partial funding is not released to creators. This protects contributors from funding projects that cannot realistically move forward.
Reward Tokenisation Upon successful campaign completion, contributors receive LUMI tokens proportional to their contribution. These tokens are ERC-20 compliant and represent verifiable proof of support, which can be tied to benefits such as film credits, exclusive content, or early access defined by the campaign creator (OpenZeppelin, 2023).
Equal Access: Any registered user with a connected wallet can contribute to active campaigns. There is no geographic restriction or minimum contribution threshold beyond zero. Campaign creation is also open to all registered users, not limited to verified professionals.
User Wallet Control: No transaction can occur on behalf of a user without an explicit confirmation signed by their connected MetaMask wallet. The platform has no ability to move funds on a user's behalf.
Business Rules
Campaign Creator (Filmmaker):
Must register and connect a MetaMask wallet before creating a campaign.
Must provide a campaign title, project description, funding goal (in ETH), and deadline at the time of creation.
Cannot modify the funding goal or deadline after the campaign is deployed on-chain.
May withdraw funds only after the smart contract confirms the goal has been reached before the deadline.
Is responsible for fulfilling any reward commitments made to LUMI token holders.
Contributor (Supporter):
Must be at least 18 years old and have a connected MetaMask wallet to contribute.
Can contribute ETH to any active campaign before its deadline; each contribution must be greater than zero.
Will automatically receive LUMI reward tokens after contributing to a campaign that successfully meets its goal, at the rate of 1 LUMI per 0.01 ETH contributed.
May claim a full refund from the smart contract if the campaign they contributed to fails to meet its goal by the deadline; refunds must be claimed from the same wallet address used to contribute.
Can view their full contribution and transaction history through the platform interface.
Smart Contract:
Holds all contributed ETH in escrow for the duration of each campaign.
Automatically determines campaign outcome based on whether the goal was met by the deadline.
Releases funds to the creator on successful campaigns and enables refund claims on failed ones.
Mints and distributes LUMI tokens to contributors following a successful campaign.
Cannot be modified after deployment; all rules are fixed at the time of contract deployment.
4.0 Objectives
The core aim of this project is to build LumiFilm, a decentralised application on the Ethereum blockchain that gives independent filmmakers a real, practical path to funding their projects without depending on centralised platforms. The specific objectives are:
To design, develop, and deploy a decentralised application (dApp) on the Ethereum testnet that enables independent filmmakers to create and manage crowdfunding campaigns for film production, with all campaign logic enforced on-chain through Solidity smart contracts.
To implement wallet-based user authentication using MetaMask and Ethereum addresses, with clear role separation between campaign creators (filmmakers) and contributors (supporters), removing the need for traditional password-based login systems.
To issue and manage an ERC-20 reward token (LUMI) that is distributed automatically to contributors upon successful campaign completion, representing verifiable benefits such as film credits, exclusive content access, or digital collectables tied to the production (OpenZeppelin, 2023).
To enable direct, trustless ETH contributions from global supporters to active film campaigns, with every transaction recorded immutably on the blockchain and accessible for public verification at any time.
To enforce an all-or-nothing funding mechanism through smart contract logic, funds are held in escrow by the contract and released to the filmmaker only if the target is met by the deadline; otherwise, the contract enables full refunds for all contributors without any manual intervention.
To develop a user-friendly front-end interface that integrates seamlessly with the deployed smart contracts, allowing users to browse live campaigns, contribute ETH, track real-time funding progress, claim refunds or LUMI tokens, and review their full transaction history within a single web application.
To provide complete on-chain storage and display of campaign histories and user transactions within the dApp, ensuring that all financial activities are permanently auditable without relying on any off-chain database controlled by a third party.
To lower the financial and logistical barriers facing independent filmmakers by building a direct, trustless connection between creators and their audience, making it genuinely possible for talented filmmakers with strong projects but limited capital to secure production funding on their own terms.
5.0 Contract Diagram




6.0 Activity Diagram
https://drive.google.com/file/d/1J4c8FD_VO2b8e3oiG9VI5USwmm8xlfkt/view?usp=sharing 
6.0.1 Activity Diagram-Admin
7.0 Use Case Diagram

8.0 System Architecture/Design Structure
https://drive.google.com/file/d/1glmUJKn-RYuT6SerFiZlWhj_j9Bk8RDh/view?usp=sharing


9.0 UI Design
https://www.figma.com/design/fFkbbsv9Nq4Yp5fMaNB4i1/Untitled?node-id=0-1&t=DU17bVwk8dxajrMY-1
10.0 Limitation and challenges
Using Ethereum smart contracts to build a decentralized independent film crowdfunding platform is an exciting and challenging experience.One of the biggest obstacles we face is the steep learning curve of blockchain technology.Most team members previously knew little about smart contracts, Solidity programming, Ethereum wallets, and Gas fees.This lack of knowledge makes system design and implementation inefficient, especially when writing secure smart contracts requires in-depth understanding to prevent vulnerabilities such as reentrant attacks or integer overflows.
Another major challenge is to ensure that the platform can effectively support the financing of film production.Although the logic used in smart contracts for full or full funding and automatic refunds works well in a test environment, real-world film projects involve complex factors such as budget changes, production delays, and milestone-based expenditures.The rigid nature of smart contracts makes it difficult to achieve a flexible fund issuance mechanism or respond to unexpected changes in the scope of the project without off-chain coordination.
Transaction costs and network performance also constitute significant limitations.At the peak of network congestion, Ethereum Gas fees can be very expensive, which may hinder small supporters from participating in movie projects.In addition, the limited transaction throughput of the public blockchain may cause delays in the processing of donation confirmation or refunds, which will have a negative impact on the user experience and platform trust.
Since blockchain data is immutable and permanently stored, once deployed, any errors in event details (such as incorrect fundraising goals, deadlines, or project descriptions) are difficult to correct.This requires us to be extra cautious during the testing phase, and we have implemented a sound verification mechanism on both the smart contract and the front end.In addition, many film producers and supporters are still unfamiliar with blockchain technology, wallets, and cryptocurrencies.Technical terminology and the need to use MetaMask or other wallets constitute barriers to availability, increasing the difficulty of user acceptance.

Finally, integrating the front-end interface with Ethereum smart contracts is technically challenging.Ensuring seamless communication between React-based front-ends, wallet connections, event monitoring, and on-chain data retrieval requires a lot of testing and debugging.Synchronizing all components while maintaining security and a smooth user experience consumes a lot of development time.





Problem Statement
Independent filmmakers withts often cannot produce their films due to high funding barriers and limited access to capital.

Traditional crowdfunding platforms charge high fees, lack transparency, delay fund release, and offer no reliable way for talented indie filmmakers to secure production money for promising projects.


Platform Policies and Business Rules
1. User Eligibility
Users must be at least 18 years old to register and participate in the crowdfunding platform. This ensures that contributors and campaign creators are legally responsible for their financial activities.

2. Wallet Authentication
All users must connect a cryptocurrency wallet, such as MetaMask, to interact with the platform. Every transaction must be signed through the wallet to verify the user's identity and ownership.

3. Campaign Creation Rule
Only registered users are allowed to create crowdfunding campaigns. Campaign creators must provide accurate details including the project title, description, funding goal, and campaign deadline.

4. Immutable Campaign Information
Once a campaign is deployed on the Ethereum network, the funding goal and deadline cannot be modified due to the immutable nature of smart contracts.

5. Contribution Rule
Users can contribute Ether (ETH) to active campaigns before the deadline. Each contribution must be greater than zero and will be recorded transparently on the blockchain.

6. Successful Campaign Policy
If a campaign reaches or exceeds its funding goal before the deadline, the campaign creator is allowed to withdraw the funds through the smart contract.

7. Failed Campaign Refund Policy
If the campaign fails to meet the funding goal within the deadline, contributors are allowed to claim refunds. Refunds must be requested using the same wallet address that made the contribution.

8. Reward Token Distribution
Contributors may receive reward tokens based on the amount they contributed. These tokens can follow standards such as ERC-20 and will be distributed after successful campaign funding.

9. Transaction Transparency
All financial activities including funding, withdrawals, and refunds will be recorded on the blockchain to ensure transparency and accountability.

10. Security and Responsible Usage
Users must not attempt to manipulate the system, exploit smart contract vulnerabilities, or create fraudulent campaigns. Any suspicious activities may result in the campaign being flagged or restricted.



Objective
The objectives of this project are to create a decentralized application (dApp) platform called LumiFilm that empowers independent filmmakers and small production teams to crowdfund their movie projects transparently and efficiently using Ethereum smart contracts. The specific objectives are as follows:
To design, develop, and deploy a decentralized application (dApp) on the Ethereum blockchain that enables independent filmmakers to launch crowdfunding campaigns for film production.
To implement secure user authentication and wallet-based access (via Ethereum addresses), allowing clear distinction between roles such as filmmakers (campaign creators) and supporters (contributors).
To issue and manage optional ERC-20 reward tokens that represent supporter benefits (e.g., exclusive access, digital collectibles, credits in the film, or proportional incentives) upon successful campaign completion.
To facilitate transparent and direct contributions of Ether from global supporters to active film campaigns, with all transactions recorded immutably on the blockchain.
To incorporate an all-or-nothing funding mechanism enforced by smart contracts: funds are automatically released to the filmmaker only if the goal is reached by the deadline; otherwise, full refunds are automatically available to contributors.
To develop a user-friendly front-end interface that seamlessly interacts with the deployed Ethereum testnet smart contracts, allowing users to browse campaigns, contribute funds, view progress, claim refunds or rewards, and access transaction history.
To provide on-chain storage and display of campaign and user transaction history within the dApp, ensuring full transparency and auditability for all participants.
To foster a direct, trustless connection between filmmakers and their audience, reducing financial barriers for talented creators with outstanding scripts and enabling high-quality independent films to reach the public.
















References
Ante, L. (2021). Smart contracts on the blockchain — a bibliometric analysis and review. Telematics and Informatics, 57, 101519. https://doi.org/10.1016/j.tele.2020.101519
Ethereum Foundation. (2023). Introduction to Ethereum. Retrieved from https://ethereum.org/en/what-is-ethereum/
Gitcoin. (2022). Gitcoin grants: Funding the open web. Retrieved from https://gitcoin.co/grants
MetaMask. (2024). MetaMask: A crypto wallet and gateway to blockchain apps. Retrieved from https://metamask.io
Mollick, E. (2022). Crowdfunding as a source of entrepreneurial opportunity: Its promises and challenges. In The Palgrave Handbook of Technological Finance (pp. 523–540). Palgrave Macmillan. https://doi.org/10.1007/978-3-030-65117-6_19
OpenZeppelin. (2023). ERC-20 token standard. Retrieved from https://docs.openzeppelin.com/contracts/4.x/erc20
Statista. (2024). Crowdfunding — worldwide: Market data and forecast. Retrieved from https://www.statista.com/outlook/dmo/fintech/digital-capital-raising/crowdfunding/worldwide
Wohrer, M., & Zdun, U. (2021). Design patterns for smart contracts in the Ethereum ecosystem. IEEE Transactions on Software Engineering, 47(8), 1731–1745. https://doi.org/10.1109/TSE.2021.3051556
