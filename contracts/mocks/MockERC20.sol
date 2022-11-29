//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "../Token.sol";

/**
 @title MockERC20
 @dev mock token contract to allow minting and burning for testing
**/  
contract MockERC20 is Token{

    constructor(string memory _name, string memory _symbol) Token(_name,_symbol){
    }

    function burn(address _account, uint256 _amount) external virtual {
        _burn(_account,_amount);
    }

    function mint(address _account, uint256 _amount) external virtual {
        _mint(_account,_amount);
    }
}
