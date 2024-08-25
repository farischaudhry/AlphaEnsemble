// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract AlphaEnsemble {
    address public oracleAddress;

    // Constructor
    constructor(address _oracleAddress) {
        oracleAddress = _oracleAddress;
    }

}
