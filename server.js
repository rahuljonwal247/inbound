

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const MasterDataFile = require('./models/MasterDataFile');
const MaterialMaster = require('./models/MaterialMaster');
const PalletTable = require('./models/PalletTable');
const Section = require('./models/Section');
const Bin = require('./models/Bin');
const AllocateBin = require('./services/binAllocation');
const ForkliftOperator = require('./models/forkliftOperator');
const TransferOrder = require('./models/transferOrder');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));
const cors = require('cors');
app.use(cors());

app.get('/', async (req, res) => {
  try {
    const lines = await MasterDataFile.find();
    const materials = await MaterialMaster.find();
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 2);
    res.render('index', { lines, materials, maxDate: maxDate.toISOString().split('T')[0] });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/process-order', async (req, res) => {
  const { date, productionLine, processOrder, skuCode, skuDesc, sut, batch, processOrderQty } = req.body;
  const bin = await AllocateBin.allocateBin(skuCode, batch);

  const SKU_Code=skuCode;
  const palletsQty = await MaterialMaster.findOne({SKU_Code})
  const pallet = new PalletTable({
    date,
    productionLine,
    processOrder,
    skuCode,
    skuDesc,
    sut,
    batch,
    processOrderQty,
    transferOrder: generateUniqueId(),
    palletId: generateUniqueId(),
    palletQty:palletsQty.PALLET_QTY,
    binNumber:bin.binNumber,
    status: ''
  });
  await pallet.save();
  res.redirect('/');
});

app.get('/pallets', async (req, res) => {
  const pallets = await PalletTable.find().populate('productionLine');
  res.render('pallets', { pallets });
});

app.put('/pallet/:id', async (req, res) => {
  const { bin, palletQty } = req.body;
  const pallet = await PalletTable.findById(req.params.id);
  pallet.bin = bin;
  pallet.palletQty = palletQty;
  await pallet.save();
  res.redirect('/pallets');
});


app.post('/assign-forklift', async (req, res) => {
  try {
    const { palletId, forkliftOperator } = req.body;
    const pallet = await PalletTable.findById(palletId);
    pallet.assignedTo = forkliftOperator;
    await pallet.save();
    res.json({ message: 'Forklift operator assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign forklift operator' });
  }
});


// app.post('/confirm-transfer-order', async (req, res) => {
//   const { transferOrder, sourceLocation, destinationLocation, skuCode, skuDesc, palletQty, threeDigitCode } = req.body;
//   console.log(transferOrder, sourceLocation, destinationLocation, skuCode, skuDesc, palletQty, threeDigitCode)
//     try {
//       // Save data to the database
//       const TransferOrder = new TransferOrder({
//         transferOrder, sourceLocation, destinationLocation, skuCode, skuDesc, palletQty, threeDigitCode, 
//       });
//        console.log(TransferOrder)
//       await TransferOrder.save();

//       res.redirect('/');
//     }
//   catch (error) {
//     res.status(500).json({ error: 'Failed to confirm transfer order' });
//   }
// });


app.post('/confirm-transfer-order', async (req, res) => {
  const { transferOrder, sourceLocation, destinationLocation, skuCode, skuDesc, palletQty, threeDigitCode } = req.body;

  try {
    // Step 1: Find the order in PalletTable
    const order = await PalletTable.findOne({ transferOrder }).exec();
    if (!order) {
      return res.status(404).json({ error: 'Transfer order not found' });
    }

    // Step 2: Get the bin number from the order
    const binNumber = order.binNumber;

    // Step 3: Find the bin in the Bin table
    const bin = await Bin.findOne({ binNumber }).exec();
    if (!bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }

    // Step 4: Check if the three-digit code matches
    const code = bin.digitCode;
    if (code !== threeDigitCode) {
      return res.status(400).json({ error: 'Incorrect three-digit code' });
    }

    // Step 5: Create a new instance of TransferOrder
    const newOrder = new TransferOrder({
      transferOrder,
      sourceLocation,
      destinationLocation,
      skuCode,
      skuDesc,
      palletQty,
      threeDigitCode
    });

    // Step 6: Save the new order to the database
    await newOrder.save();
    order.status = 'Confirmed'; 
    order.digitCode= threeDigitCode;
    await order.save();
    // Step 7: Redirect or respond with success
    res.redirect('/');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to confirm transfer order' });
  }
});

app.get('/forkliftOperator', async (req, res) => {
  try {
      const data = await PalletTable.findOne(); // Adjust this to match your data retrieval logic
      res.render('forkliftOperator',{data});
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Get incomplete process orders
app.get('/incomplete-process-orders', async (req, res) => {
  const orders = await TransferOrder.find({ status: 'Pending' });
  res.json(orders);
});

// Assign a forklift operator to a process order
app.post('/assign-forklift', async (req, res) => {
  try {
      const { processOrder, forkliftOperatorId } = req.body;
      const order = await TransferOrder.findOne({ processOrder, status: 'Pending' });

      if (order) {
          order.forkliftOperator = forkliftOperatorId;
          await order.save();
          res.status(200).json({ success: true });
      } else {
          res.status(404).json({ success: false, message: 'Process Order not found or already completed.' });
      }
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});

// Update pallet qty and destination location
app.put('/update-transfer-order/:id', async (req, res) => {
  try {
      const { palletQty, binNumber } = req.body;
      const order = await TransferOrder.findById(req.params.id);

      if (order) {
          order.palletQty = palletQty;
          order.binNumber = binNumber;
          await order.save();
          res.status(200).json({ success: true });
      } else {
          res.status(404).json({ success: false, message: 'Transfer Order not found.' });
      }
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});

// Confirm transfer order
// app.put('/confirm-transfer-order/:id', async (req, res) => {
//   try {
//       const { threeDigitCode } = req.body;
//       const order = await TransferOrder.findById(req.params.id);

//       if (order) {
//           order.threeDigitCode = threeDigitCode;
//           order.status = 'Confirmed';
//           await order.save();
//           res.status(200).json({ success: true });
//       } else {
//           res.status(404).json({ success: false, message: 'Transfer Order not found.' });
//       }
//   } catch (error) {
//       res.status(500).json({ success: false, message: error.message });
//   }
// });


app.get('/TransferOrders', async (req, res) => {
  const pallets = await TransferOrder.find();
  res.render('TransferOrders', { pallets });
});
// Delete a transfer order
app.delete('/delete-transfer-order/:id', async (req, res) => {
  try {
      await TransferOrder.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true });
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
});


//login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('hello')
    const user = await ForkliftOperator.findOne({ username });
    console.log(user)
     console.log(user.password==password)
    if ( user.password==password) {
      res.redirect('/forkliftOperator');
    }
    else{
      return res.status(400).send('Invalid credentials');
    }
   
  } catch (error) {
    res.status(500).send('Error logging in user');
  }
});
app.get('/login', async (req, res) => {
  res.render('login');
});
const pallets = {
  date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
  processOrders: ['PO1234', 'PO5678', 'PO9101'],
  forkliftOperators: ['John Doe', 'Jane Smith', 'Emily Johnson']
};
app.get('/forkliftAssignment', async(req, res) => {
  // const operators = await ForkliftOperator.find();
  res.render('forkliftAssignment', pallets);
});

// app.post('/allocate-bin', async (req, res) => {
//   const { skuCode, batch } = req.body;

//   try {
//     const allocatedBin = await allocateBin.allocateBin(skuCode, batch);
//     res.json(allocatedBin);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


app.listen(3000, () => {
  console.log('Server running on port 3000');
});

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}


