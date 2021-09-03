const User = require("../models/User");
const router = require('express').Router();
const bcrypt = require('bcrypt');
//update
router.put('/:id', async (req, res) => {
    if(req.body.userId == req.params.id || req.body.isAdmin){
        if(req.body.password){
            try{
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            }catch(err){
                return res.status(500).json(err);
            }
        }
        try{
            const user = await User.findByIdAndUpdate(req.params.id,{
                $set:req.body,
            });
            res.status(200).json("Account updated");

        }catch(err){
             return res.status(500).json(err);
        }
    }else{
        return res.status(403).json("You can update only your account");
    }
});
//delete
router.delete('/:id', async (req, res) => {
    if(req.body.userId === req.params.id || req.body.isAdmin){
        try{
            const user = await User.deleteOne({_id:req.params.id});
            res.status(200).json("Account has been deleted");
        }catch(err){
            return res.status(500).json(err);
        }
    }else{
        return res.status(403).json("You ccan only delete your account");
    }
})


//get a user
router.get('/', async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;
    try{
        const user = userId 
        ?await User.findById(userId)
        : await User.findOne({username:username});
        const {password, updatedAt, ...other} = user._doc;
        res.status(200).json(other);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
});

//get friends
router.get('/friends/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const firends = await Promise.all(
            user.followings.map(friendId=>{
                return User.findById(friendId);
            })
        );
        let friendList = [];
        firends.map(friend=>{
            const {_id, username, profilePicture} = friend;
            friendList.push({_id, username, profilePicture});
        });
        res.status(200).json(friendList);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
        
    }
})

//follow a user

router.put('/:id/follow', async (req, res) => {
    if(req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if(!user.followers.includes(req.body.userId)){
                await user.updateOne({$push:{followers:req.body.userId}});
                await currentUser.updateOne({$push:{followings:req.params.id}});
                res.status(200).json("You have successfully follow this user");
            }else{
                res.status(403).json("you already follow this user");
            }
        }catch(err){
            console.log(err);
            res.status(500).json(err); 
        }
    }else{
        res.status(403).json("You ccan only follow your account");
    }
});
//unfollow a user

router.put('/:id/unfollow', async (req, res) => {
    if(req.body.userId !== req.params.id){
        try{
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.body.userId);
            if(user.followers.includes(req.body.userId)){
                await user.updateOne({$pull:{followers:req.body.userId}});
                await currentUser.updateOne({$pull:{followings:req.params.id}});
                res.status(200).json("You have successfully unfollow this user");
            }else{
                res.status(403).json("you already unfollow this user");
            }
        }catch(err){
            console.log(err);
            res.status(500).json(err); 
        }
    }else{
        res.status(403).json("You ccan only unfollow your account");
    }
});

module.exports = router;