// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Crowdfunding {
    struct Project {
        address creator;
        string title;
        string description;
        uint256 targetAmount;
        uint256 raisedAmount;
        string imageUrl;
        bool isActive;
        uint256 deadline;
        mapping(address => uint256) contributions;
        Milestone[] milestones;
        uint256 currentMilestone;
    }

    struct Milestone {
        string description;
        uint256 amount;
        bool isCompleted;
        bool isFunded;
    }

    Project[] public projects;
    uint256 public projectCount;

    event ProjectCreated(uint256 indexed projectId, address creator, string title, uint256 targetAmount);
    event ContributionMade(uint256 indexed projectId, address contributor, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId, uint256 raisedAmount);
    event ProjectCancelled(uint256 indexed projectId);
    event FundsWithdrawn(uint256 indexed projectId, address creator, uint256 amount);
    event MilestoneAdded(uint256 indexed projectId, uint256 milestoneId, string description, uint256 amount);
    event MilestoneCompleted(uint256 indexed projectId, uint256 milestoneId);
    event MilestoneFunded(uint256 indexed projectId, uint256 milestoneId, uint256 amount);

    function createProject(
        string memory _title,
        string memory _description,
        uint256 _targetAmount,
        string memory _imageUrl,
        uint256 _durationInDays
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_targetAmount > 0, "Target amount must be greater than 0");
        require(_durationInDays > 0, "Duration must be greater than 0");

        uint256 projectId = projects.length;
        Project storage newProject = projects.push();
        
        newProject.creator = msg.sender;
        newProject.title = _title;
        newProject.description = _description;
        newProject.targetAmount = _targetAmount;
        newProject.imageUrl = _imageUrl;
        newProject.isActive = true;
        newProject.deadline = block.timestamp + (_durationInDays * 1 days);
        
        projectCount++;
        
        emit ProjectCreated(projectId, msg.sender, _title, _targetAmount);
        return projectId;
    }

    function contribute(uint256 _projectId) public payable {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        require(block.timestamp < project.deadline, "Project deadline has passed");
        require(msg.value > 0, "Contribution amount must be greater than 0");

        project.contributions[msg.sender] += msg.value;
        project.raisedAmount += msg.value;

        emit ContributionMade(_projectId, msg.sender, msg.value);

        if (project.raisedAmount >= project.targetAmount) {
            project.isActive = false;
            emit ProjectCompleted(_projectId, project.raisedAmount);
        }
    }

    function addMilestone(
        uint256 _projectId,
        string memory _description,
        uint256 _amount
    ) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only project creator can add milestones");
        require(project.isActive, "Project must be active");
        require(_amount > 0, "Milestone amount must be greater than 0");

        project.milestones.push(Milestone({
            description: _description,
            amount: _amount,
            isCompleted: false,
            isFunded: false
        }));

        emit MilestoneAdded(_projectId, project.milestones.length - 1, _description, _amount);
    }

    function completeMilestone(uint256 _projectId, uint256 _milestoneId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only project creator can complete milestones");
        require(_milestoneId < project.milestones.length, "Milestone does not exist");
        require(!project.milestones[_milestoneId].isCompleted, "Milestone already completed");
        require(_milestoneId == project.currentMilestone, "Must complete milestones in order");

        project.milestones[_milestoneId].isCompleted = true;
        project.currentMilestone++;

        emit MilestoneCompleted(_projectId, _milestoneId);
    }

    function withdrawMilestoneFunds(uint256 _projectId, uint256 _milestoneId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only project creator can withdraw");
        require(_milestoneId < project.milestones.length, "Milestone does not exist");
        require(project.milestones[_milestoneId].isCompleted, "Milestone must be completed");
        require(!project.milestones[_milestoneId].isFunded, "Milestone already funded");
        require(project.raisedAmount >= project.milestones[_milestoneId].amount, "Insufficient funds");

        uint256 amount = project.milestones[_milestoneId].amount;
        project.raisedAmount -= amount;
        project.milestones[_milestoneId].isFunded = true;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit MilestoneFunded(_projectId, _milestoneId, amount);
    }

    function getMilestoneCount(uint256 _projectId) public view returns (uint256) {
        require(_projectId < projects.length, "Project does not exist");
        return projects[_projectId].milestones.length;
    }

    function getMilestoneDetails(
        uint256 _projectId,
        uint256 _milestoneId
    ) public view returns (
        string memory description,
        uint256 amount,
        bool isCompleted,
        bool isFunded
    ) {
        require(_projectId < projects.length, "Project does not exist");
        require(_milestoneId < projects[_projectId].milestones.length, "Milestone does not exist");
        
        Milestone storage milestone = projects[_projectId].milestones[_milestoneId];
        return (
            milestone.description,
            milestone.amount,
            milestone.isCompleted,
            milestone.isFunded
        );
    }

    function withdrawFunds(uint256 _projectId) public {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        require(msg.sender == project.creator, "Only project creator can withdraw");
        require(!project.isActive, "Project must be completed or cancelled");
        require(project.raisedAmount > 0, "No funds to withdraw");

        uint256 amount = project.raisedAmount;
        project.raisedAmount = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(_projectId, msg.sender, amount);
    }

    function getProjectDetails(uint256 _projectId) public view returns (
        address creator,
        string memory title,
        string memory description,
        uint256 targetAmount,
        uint256 raisedAmount,
        string memory imageUrl,
        bool isActive,
        uint256 deadline
    ) {
        require(_projectId < projects.length, "Project does not exist");
        Project storage project = projects[_projectId];
        
        return (
            project.creator,
            project.title,
            project.description,
            project.targetAmount,
            project.raisedAmount,
            project.imageUrl,
            project.isActive,
            project.deadline
        );
    }

    function getContributionAmount(uint256 _projectId, address _contributor) public view returns (uint256) {
        require(_projectId < projects.length, "Project does not exist");
        return projects[_projectId].contributions[_contributor];
    }

    function getProjectCount() public view returns (uint256) {
        return projectCount;
    }
} 