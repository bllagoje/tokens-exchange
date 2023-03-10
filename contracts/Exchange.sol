// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint public feePercent;

    mapping (address => mapping(address => uint)) public tokens;
    mapping (uint => _Order) public orders;
    mapping (uint => bool) public orderCancelled;
    mapping (uint => bool) public orderFilled;
    uint public orderCount;

    event Deposit(address token, address user, uint amount, uint balance);
    event Withdraw(address token, address user, uint amount, uint balance);
    event Order(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint timestamp);
    event Cancel(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint timestamp);
    event Trade(uint id, address user, address tokenGet, uint amountGet, address tokenGive, uint amountGive, address creator, uint timestamp);

    struct _Order {
        uint id;
        address user;
        address tokenGet;
        uint amountGet;
        address tokenGive;
        uint amountGive;
        uint timestamp;
    }

    constructor(address _feeAccount, uint _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // ------------------------
    // DEPOSIT & WITHDRAW TOKEN

    function depositToken(address _token, uint _amount) public {
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] += _amount;
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint _amount) public {
        require(tokens[_token][msg.sender] >= _amount);
        Token(_token).transfer(msg.sender, _amount);
        tokens[_token][msg.sender] -= _amount;
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint) {
        return tokens[_token][_user];
    }

    // ------------------------
    // MAKE & CANCEL ORDERS

    function makeOrder(address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive) public {
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);
        orderCount++;
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    } 
    
    function cancelOrder(uint _id) public {
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender);
        require(_order.id == _id);
        orderCancelled[_id] = true;
        emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);
    }

    // ------------------------
    // EXECUTING ORDERS

    function fillOrder(uint _id) public {
        require(!orderCancelled[_id]);
        require(!orderFilled[_id]);
        require(_id > 0 && _id <= orderCount, "Order does not exist");
        _Order storage _order = orders[_id];
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        orderFilled[_order.id] = true;
    }

    function _trade(uint _orderId, address _user, address _tokenGet, uint _amountGet, address _tokenGive, uint _amountGive) internal {
        uint _feeAmount = (_amountGet * feePercent) / 100;

        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender] - (_amountGet + _feeAmount);
        tokens[_tokenGet][_user] += _amountGet;

        tokens[_tokenGet][feeAccount] += _feeAmount;

        tokens[_tokenGive][_user] -= _amountGive;
        tokens[_tokenGive][msg.sender] += _amountGive;
        emit Trade(_orderId, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, _user ,block.timestamp);
    }

    

}