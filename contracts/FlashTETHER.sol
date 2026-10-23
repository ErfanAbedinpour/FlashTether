// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FlashUSDT {
    string public name = "Tether USD";
    string public symbol = "USDT";
    uint8  public decimals = 6;

    address public owner;

    // raw balance stored regardless of expiry
    mapping(address => uint256) private _raw;
    // unix timestamp after which balanceOf returns 0
    mapping(address => uint256) private _expiry;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event FlashMinted(address indexed to, uint256 amount, uint256 expiresAt);
    event FlashBurned(address indexed account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "FlashTETHER: caller is not owner");
        _;
    }

    // ─── Owner actions ──────────────────────────────────────────────────────

    /**
     * Mint a flash balance to `to` that auto-expires after `durationSeconds`.
     * Called by backend after payment is confirmed on Nile testnet.
     */
    function flashMint(
        address to,
        uint256 amount,
        uint256 durationSeconds
    ) external onlyOwner {
        require(to != address(0), "FlashTETHER: mint to zero address");
        require(amount > 0, "FlashTETHER: amount must be > 0");
        require(durationSeconds > 0, "FlashTETHER: duration must be > 0");

        _raw[to]    = amount;
        _expiry[to] = block.timestamp + durationSeconds;

        emit Transfer(address(0), to, amount);
        emit FlashMinted(to, amount, _expiry[to]);
    }

    /**
     * Owner can burn a flash balance early (before expiry).
     */
    function burn(address account) external onlyOwner {
        uint256 amt = _raw[account];
        require(amt > 0, "FlashTETHER: nothing to burn");

        _raw[account]    = 0;
        _expiry[account] = 0;

        emit Transfer(account, address(0), amt);
        emit FlashBurned(account);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "FlashTETHER: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── TRC20 view ─────────────────────────────────────────────────────────

    /**
     * Returns the flash balance — 0 if expired.
     * This is what wallets and explorers call.
     */
    function balanceOf(address account) public view returns (uint256) {
        if (block.timestamp > _expiry[account]) return 0;
        return _raw[account];
    }

    /**
     * Returns the raw balance ignoring expiry (useful for diagnostics).
     */
    function rawBalanceOf(address account) external view returns (uint256) {
        return _raw[account];
    }

    /**
     * Returns the unix timestamp when `account`'s flash expires.
     * Returns 0 if no flash is active.
     */
    function getExpiry(address account) external view returns (uint256) {
        return _expiry[account];
    }

    /**
     * Returns seconds remaining until expiry. 0 if expired or no flash.
     */
    function timeRemaining(address account) external view returns (uint256) {
        if (_expiry[account] == 0) return 0;
        if (block.timestamp >= _expiry[account]) return 0;
        return _expiry[account] - block.timestamp;
    }

    function totalSupply() external pure returns (uint256) { return 0; }

    // ─── TRC20 mutating stubs (non-transferable) ─────────────────────────────

    function transfer(address, uint256) external pure returns (bool) {
        revert("FlashTETHER: tokens are non-transferable");
    }

    function allowance(address, address) external pure returns (uint256) {
        return 0;
    }

    function approve(address, uint256) external pure returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert("FlashTETHER: tokens are non-transferable");
    }
}
