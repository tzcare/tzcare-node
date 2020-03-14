const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const aesjs = require('aes-js');
const conseiljs = require('conseiljs');

require('dotenv').config()
conseiljs.setLogLevel('debug');

const mcu = process.env.SERIAL_DEVICE;
const port = new SerialPort(mcu, { baudRate: JSON.parse(process.env.SERIAL_SPEED) })

const parser = new Readline()
port.pipe(parser)

const key = JSON.parse(process.env.AES_KEY);
const iv = JSON.parse(process.env.IV);

parser.on('data', encryptedBytes => {
    var encryptedBytes = encryptedBytes.split(' ').map(Number);
    encryptedBytes = encryptedBytes.slice(0, -1);

    var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    var decryptedBytes = aesCbc.decrypt(encryptedBytes);
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

    sendToTezosBlockchain(decryptedText);
})

sendToTezosBlockchain = (value) => {

    const tezosNode = process.env.NODE;

    async function invokeContract() {
        const keystore = {
            publicKey: process.env.PUBLIC_KEY,
            privateKey: process.env.PRIVATE_KEY,
            publicKeyHash: process.env.PUBLIC_KEY_HASH,
            seed: '',
            storeType: conseiljs.StoreType.Fundraiser
        };

        const result = await conseiljs.TezosNodeWriter.sendContractInvocationOperation(tezosNode, keystore, process.env.CONTRACT_ADDRESS, 0, 100000, '', 1000, 100000, '', `{"string": "${value}"}`, conseiljs.TezosParameterFormat.Micheline);
        console.log(`Injected operation group id ${result.operationGroupID}`);
    }

    invokeContract();
}

