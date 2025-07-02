var express = require('express');
var router = express.Router();



const admin = require('../controller/admincontroller/authcontroller');
const cms  = require('../controller/admincontroller/cmscontroller');
const contactus = require('../controller/admincontroller/contactcontroller');
const rewards = require('../controller/admincontroller/rewardcontroller');
const package = require('../controller/admincontroller/packagecontroller');
const carrier = require('../controller/admincontroller/carriercontroller');
const TransactionController = require('../controller/TransactionController');
const RedeemController = require('../controller/admincontroller/RedeemController');

// router to render 
router.get('/dashboard', admin.dashboard);
router.get('/login', admin.login);

//router to login dashboard
router.post('/loginpost',admin.loginpost);

// router for profile
router.get('/profile', admin.profile);
router.post('/profileupdate',admin.edit_profile);
router.get('/password', admin.password);
router.post('/updatepassword',admin.updatepassword);
router.get('/logout', admin.logout);

// router for customerlist
router.get('/customerlist', admin.user_list);
router.get('/view/:id', admin.view);
router.post('/delete/:id',admin.user_delete);
router.post('/status', admin.user_status);
router.get('/addcustomer',admin.customer_add_get);
router.post('/addcustomer',admin.customer_add_post);
router.get('/editcustomer/:id',admin.customer_edit_get);
router.post('/customerupdate/:id',admin.customer_edit_post);

//router for cms
router.get('/privacy', cms.privacy);
router.post('/privacy', cms.privacy_update);
router.get('/aboutus', cms.aboutus);
router.post('/aboutus', cms.aboutusupdate);
router.get('/term',cms.term);
router.post('/term', cms.terms);

// router for contactus
router.post('/createcontactus',contactus.createcontactus);
router.get('/contacts',contactus.getcontacts);
router.post('/deletecontact/:id',contactus.deletecontact);
router.get('/viewcontact/:id',contactus.contactview);
router.get('/addcontact', contactus.contactadd);
router.get('/chat', contactus.chat);


// router for rewards
router.post('/createreward',rewards.createreward);
router.get('/rewards', rewards.rewards);
router.get('/rewardview/:id', rewards.rewardview);
router.post('/deletereward/:id',rewards.deletereward);
router.get('/addreward', rewards.rewardadd);
router.get('/rewardedit/:id', rewards.reward_edit_get);
router.post('/rewardupdate/:id', rewards.reward_edit_post);

// router for transaction
router.get('/transactionadd',TransactionController.transactionadd);
router.post('/createtransaction', TransactionController.createtransaction);
router.get('/transactionview/:id', TransactionController.transactionview);
router.get('/transactionlist', TransactionController.transactionlist);
router.post('/deletetransaction/:id',TransactionController.deletetransaction);
router.post("/statusupdate_transaction", TransactionController.statusupdate_transaction);

// router for reddempoint
router.get('/redeempointadd',RedeemController.redeempointadd);
router.post('/createredeempoint', RedeemController.createredeempoint);
router.get('/redeempointlist', RedeemController.redeempointlist);
router.get('/redeempointview/:id', RedeemController.redeempointview);
router.post('/deletepoint/:id', RedeemController.deletepoint);
router.get('/editredeempoint/:id', RedeemController.editredeempoint);
router.post('/updateredeempoint/:id', RedeemController.updateredeempoint);

// router for packages
router.get('/packagelist', package.packagelist);
router.get('/packageview/:id', package.pacakge_view);
router.post('/packagedelete',package.packagedelete);
// router.get('/addpackage',package.package_add_get);
// router.post('/addpackage12',package.package_add_post);
router.post('/package_status',package.package_status);
// router.get('/editpackage/:id',package.package_edit_get);
// router.post('/editpackage/:id',package.package_update);


//router for carrier
router.get('/carrierlist',carrier.carrier_list);
router.get('/carrierview/:id',carrier.carrier_view);
router.post('/carrierdelete/:id',carrier.carrier_delete);
router.get('/addcarrier',carrier.carrier_add);
router.post("/carrier_add_post",carrier.carrier_add_post);
router.get('/carrieredit/:id',carrier.carrier_edit_get);
router.post('/carrierupdate/:id',carrier.carrier_edit_post);
router.post('/carrierstatus',carrier.carrier_status);


module.exports = router;
