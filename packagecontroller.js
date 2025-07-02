const db = require('../../models');
const helper = require("../../helper/helper");
const path = require('path');
const uuid = require('uuid').v4;

db.packages.belongsTo(db.users,{
    foreignKey:"user_id",
    as:"data"
  });
  db.packages.belongsTo(db.carrier,{
    foreignKey:"carrier_id",
    as:"carriers"
  });
db.packages.hasMany(db.package_images,{
    foreignKey:"package_id",
    as:'img'
  });
module.exports={
    packagelist:async(req,res)=>{
        
        try {
            if (!req.session.admin) return res.redirect("/login");
            const { startDate, endDate } = req.query;

            const whereCondition = {};
        if (startDate && endDate) {
            whereCondition.date = {
                [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

            const data = await db.packages.findAll({
              where: whereCondition, // Apply the date filter
                include:[{model: db.users, as:'data'},
                    {
                        model:db.carrier,
                        as:"carriers"
                    }
                    
                ]
            });
            
            if(startDate && endDate){
              return res.json({'success':true,data:data})
            }
            
            res.render("admin/packeges.ejs", {
                title: "Packges",
                data,
                session: req.session.admin,
            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    pacakge_view:async(req,res)=>{
        try {
            if (!req.session.admin) return res.redirect("/login");
            const view = await db.packages.findOne({
                include:[{model: db.users, as:'data'},
                    {
                        model:db.package_images,
                        as:"img"
                    },   {
                        model:db.carrier,
                        as:"carriers"
                    }
                ],
                where:{id:req.params.id}});
        
            res.render("admin/packageview.ejs", {
                title: "Package Detail",
                view,
                session: req.session.admin,
            });
        } catch (error) {
            req.flash("error", "Something went wrong, please try again");
      return res.redirect('/dashboard');
        }
    },
    packagedelete: async (req, res) => {
      try {
          const packageId = req.body.id;
          if (!packageId) {
              return res.status(400).json({ success: false, message: "Package ID is required" });
          }
          const service = await db.packages.findByPk(packageId);
          if (!service) {
              return res.status(404).json({ success: false, message: "Package not found" });
          }
          await db.packages.destroy({
              where: { id: packageId }
          });
          return res.status(200).json({ success: true, message: "Package deleted successfully" });
      } catch (error) {
        req.flash("error", "Something went wrong, please try again");
        return res.redirect('/dashboard');
      }
    },
    // package_add_get: async (req, res) => {
    //     try {
    //       if (!req.session.admin) return res.redirect("/login");
    //       const session = req.session.admin;

    //       const customerlist = await db.users.findAll({
    //         where: {role:'1', status: 1 }, 
    //         raw: true
    //       });
    //       // console.log(customerlist);
    //       // return
    //       const carrier = await db.carrier.findAll({
    //         where: { status: 1 }, 
    //         raw: true
    //       });

    //       // console.log(customerlist,carrier,"SSSS"); return
          
      
    //       res.render("admin/addpackages.ejs", {
    //         title: "Add Package",
    //         customerlist,
    //         carrier,
    //         session
    //       });
    //     } catch (error) {
    //       console.error("Error add", error);
    //       res.status(500).json({ success: false, message: "Internal server error" });
    //     }
    // },
    // package_add_post: async (req, res) => {
    //     try {

            
    //       if (!req.session.admin) {
    //         return res.redirect("/login");
    //       }
    //       // console.log(req.body)
    //       // return
      
    //       // File upload logic
    //       const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
    //       const filepaths = [];
      
    //       // Ensure images are being uploaded
    //       if (!req.files || !req.files.image) {
    //         req.flash("error", "No images uploaded");
    //         return res.redirect("back");
    //       }
      
    //       for (const file of files) {
    //         if (file && file.name) {
    //           const extension = path.extname(file.name);
    //           const filename = uuid() + extension;
    //           const filePath = path.join(process.cwd(), "/public/images", filename);
      
    //           // Save file to the server
    //           await file.mv(filePath);
    //           filepaths.push(`/images/${filename}`); // Store relative file path
    //         }
    //       }
       

    //       // Create the package entry in the database
    //       const package = await db.packages.create({
    //         user_id: req.body.user_id,
    //         tracking_number: req.body.tracking_number,
    //         carrier_id: req.body.carrier_id,
    //         sender: req.body.sender,
    //         weight: req.body.weight,
    //         self_location: req.body.self_location,
    //         message: req.body.message, // This might be optional if the field is not required
    //       });
    //       // console.log(package,">>>>>>>>>>>>>>>>>>>");return
        
    //       for (const filePath of filepaths) {
    //         await db.package_images.create({
    //           package_id: package.id,
    //           image: filePath,
    //         });
    //       }
      
    //       req.flash("success", "Package added successfully");
    //       res.redirect("/packagelist"); // Redirect to the package list after success
      
    //     } catch (error) {
    //       console.error("Error adding package:", error);
    //       req.flash("error", "Internal server error while adding package");
    //       // res.redirect("back"); // Redirect back in case of error
    //     }
    // },
    package_status: async (req, res) => {
        try {
            const { id, status } = req.body;
    
            if (!id || status === undefined) {
                return res.json({ success: false, message: "Invalid data provided" });
            }
    
            
            const result = await db.packages.update(
                { status }, 
                { where: { id } } 
            );
    
            if (result[0] > 0) {
                return res.json({ success: true, message: "Status updated successfully" });
            } else {
                return res.json({ success: false, message: "No package found with the given ID" });
            }
        } catch (error) {
            console.error("Error updating package status:", error);
            res.json({ success: false, message: "An error occurred while updating the status" });
        }
    },
    
    // package_edit_get: async (req, res) => {
    //   try {
    //     if (!req.session.admin) return res.redirect("/login");
    //     const session = req.session.admin;

    //     const data = await db.packages.findOne({
    //       where:{
    //         id:req.params.id
    //       },
    //         include:[{model: db.users, as:'data'},
    //             {
    //                 model:db.carrier,
    //                 as:"carriers"
    //             }
                
    //         ]
    //     });

    //     const images = await db.package_images.findAll({
    //       where:{
    //         package_id:req.params.id
    //       },
    //       raw:true
    //     })

    //     // console.log(images,"DDDD")
    //     // return

    //     const customerlist = await db.users.findAll({
    //       where: {role:'1', status: 1 }, 
    //       raw: true
    //     });
    //     // console.log(customerlist);
    //     // return
    //     const carrier = await db.carrier.findAll({
    //       where: { status: 1 }, 
    //       raw: true
    //     });

    //     // console.log(customerlist,carrier,"SSSS"); return
        
    
    //     res.render("admin/editpackage", {
    //       title: "Edit Package",
    //       customerlist,
    //       carrier,
    //       data,
    //       session,
    //       images
    //     });
    //   } catch (error) {
    //     console.error("Error add", error);
    //     res.status(500).json({ success: false, message: "Internal server error" });
    //   }
    // },
    // package_update: async (req, res) => {
    //   try {
    //     if (!req.session.admin) return res.redirect("/login");
    //     const session = req.session.admin;

    //     const existingImages = await db.package_images.findAll({
    //       where: { package_id: req.params.id },
    //     });
  
    //     const files = req.files && req.files.image ? (Array.isArray(req.files.image) ? req.files.image : [req.files.image]) : [];
    //     const filepaths = [];

    //     if (files.length === 0 && existingImages.length === 0) {
    //       req.flash("error", "At least one image is required for the package.");
    //       return res.redirect(`back`);
    //     }
    //     if (files.length > 0) {
    //       await db.package_images.destroy({
    //         where: { package_id: req.params.id },
    //       });
    //       for (const file of files) {
    //         if (file && file.name) {
    //           const extension = path.extname(file.name);
    //           const filename = uuid() + extension;
    //           const filePath = path.join(process.cwd(), "/public/images", filename);
    //           await file.mv(filePath);
    //           filepaths.push(`/images/${filename}`); 
    //         }
    //       }
    //     }
    
    //     await db.packages.update(req.body, {
    //       where: { id: req.params.id },
    //     });
    
    //     for (const filePath of filepaths) {
    //       await db.package_images.create({
    //         package_id: req.params.id,
    //         image: filePath,
    //       });
    //     }
    
    //     req.flash("success", "Package updated successfully");
    //     return res.redirect("/packagelist");
    //   } catch (error) {
    //     console.error("Error updating package", error);
    //     res.status(500).json({ success: false, message: "Internal server error" });
    //   }
    // },
    
}