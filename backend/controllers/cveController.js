export const investigateCVE = async (req, res) => {

    const { cve } = req.body;

    if (!cve) {
        return res.status(400).json({
            success: false,
            message: "CVE ID is required."
        });
    }

    res.json({
        success: true,
        message: "CVE endpoint working.",
        data: {
            cve
        }
    });

};