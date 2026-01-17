
module.exports = {
    generate:  function (callback){
        mobile = "98316347"
        amount = "1.67"

        //finding current time and formatting
        const now = new Date();
        now.setHours(now.getHours() + 1);
        const pad = (n) => String(n).padStart(2, "0");
        const dateTimeString =
        `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ` +
        `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const encodedDateTime = encodeURIComponent(dateTimeString);

        fetch(`https://www.sgqrcode.com/paynow?mobile=${mobile}&uen=&editable=1&amount=${amount}&expiry=${encodedDateTime}&ref_id=NA&company=`).then(
            (res)=>{
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
               return res.arrayBuffer();
            })
            .then((ab) =>{
                const buffer = Buffer.from(ab)
                callback(null, buffer)   // success
            })
            .catch((err) => callback(err));  

    }
}

