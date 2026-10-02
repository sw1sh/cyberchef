/**
 * The Paradigm Kryptos-CTF panels PK1-10: ciphertexts, and decryption recipes for PK1-9, every key a word.
 * Generated from puzzles-check/recipes.mjs.
 *
 * @license Apache-2.0
 */

export const PK_BOOK = [
    {
        "title": "PK1 - Quagmire III PROVENANCE",
        "input": "MQRALWVSJIMSXGJSVWQPHJMDINKXGIMHNKYUTXTTGJCYIABTJUMQEOFBITNBMONGVWETDLAIJPQYMZIKBQVRXZHUIJVDJLTQHIQYHEQKFTPTJYCONAFXYWQIBONAYXGWJFFIQMVXNVQYQFMWKFEJQYZFBWKXBKDQLJRELWGWDKHECRSFBKOVQJCPYDNKXYHE",
        "recipe": [
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "PROVENANCE",
                    "Vigenere"
                ]
            }
        ]
    },
    {
        "title": "PK2 - Columnar HARDENS",
        "input": "HNETIOCOIOISNNENEELOWYTTLQUBDBTHTEOTRRASAHCDSEETONVRCESHRRETUPCITEWIGNIUNIGANLHJRAHMSRUINHERAEEAEAJEEEEKEEDATIIAONIXRNRHCNTLGLOIIUNSEESEGNBANTVTCSFREDIUROTNENHMRIIEROLTLSDAOOAEQIEOAPUHITHAIKHTIEUHGSLAFFSNVRSRHNNSMASTIPIAHAOEEUDESSOEONCDHAOTOOEOTSEECLADNHNTOUVSGAGTATSNEWHSATEUEETEURTRNEOGITREHMPPROBEOETOERICETGSMTEITENNSGSDRNOVTTFBTTATMLOSOPLSTARATE",
        "recipe": [
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "HARDENS",
                    "TopToBottom"
                ]
            }
        ]
    },
    {
        "title": "PK3 - Quagmire PENTIMENTO + ORDINATE",
        "input": "HWZTRPPVHZLHRBQBQOMZBACNOTHLYGBATBTKHERQHRVZWWXCTZLRRVZCROHCIOTBVJKCALNKFJHEIMKUHJPFNVBCGQYNZMOHGBUTDPTJTDSUBOLYPLSKIEMANXMFNDBCTNRTLLVQOXUBPAXQUVDNXUMCIFOGETZWHJDIWDBWQFXAOMWBBCQXYZFZBTRIQMYOFFMVWSFLPTHFFQUINGLAMSQJOPUESPIQGZZCTJVRLQMIIRROOGBWNPQMXFQDVFTCVGNRIXQKUYYKBRTWPCDHLAWC",
        "recipe": [
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "PENTIMENTO ORDINATE",
                    "Vigenere"
                ]
            }
        ]
    },
    {
        "title": "PK4 - Quagmire OCHRE + VERDIGRIS, Columnar UNDERLAY",
        "input": "YOVISYUAFKUQNRJQLZTAZTMQOUKELJKCYUWIDSPSWRJRUEZNIFPUMUHQFFVBGOBEPWNTZGKVUTOVFSADUJUAYGWKQYOGNKHZVQMEWHSJGJFOBPHXKAPEXPWRJTSPSIJLCSXYTLDFBNZNPUAZNBZPKRFCUZDDZHZULZVPVWCXSIUVSCCFATGSJPNIGCJVTMUPTCGRTOFRXWCYKOMXOJKCECRUCKBDCIYJ",
        "recipe": [
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "OCHRE VERDIGRIS",
                    "Vigenere"
                ]
            },
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "UNDERLAY",
                    "TopToBottom"
                ]
            }
        ]
    },
    {
        "title": "PK5 - Running key = PK4's plaintext, Columnar = its first 8 letters",
        "input": "IJQUVJJINKWMJBNJHKZZMTVTUBFHXZJIUHOVONZNXKFUALEMYWTNNNILTRNVSXIXIQCLOSFZVZGTHQKZFJJHJMJTSEPAMKNMTGPVFWSWSBSIHOJWNFXDIJPJNOVBWWXJYUVVAFTIDZISJNCIGHXKLNFEQRDVYIXUXQIZFNXAKYXIUEVGRBMHWRFDZSMMDPMKIZNUQUJNXVZTGHCNAUVIYZCLRAVMJKAOIBOPZTJUPACSTFFLERTGBFFNCYTAVIRXXYOXHCDWHWWKAMQO",
        "recipe": [
            {
                "op": "Register",
                "args": [
                    "([\\s\\S]*)",
                    true,
                    false,
                    false
                ]
            },
            {
                "op": "Find / Replace",
                "args": [
                    {
                        "option": "Regex",
                        "string": "^[\\s\\S]*$"
                    },
                    "YOVISYUAFKUQNRJQLZTAZTMQOUKELJKCYUWIDSPSWRJRUEZNIFPUMUHQFFVBGOBEPWNTZGKVUTOVFSADUJUAYGWKQYOGNKHZVQMEWHSJGJFOBPHXKAPEXPWRJTSPSIJLCSXYTLDFBNZNPUAZNBZPKRFCUZDDZHZULZVPVWCXSIUVSCCFATGSJPNIGCJVTMUPTCGRTOFRXWCYKOMXOJKCECRUCKBDCIYJ",
                    true,
                    false,
                    true,
                    false
                ]
            },
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "OCHRE VERDIGRIS",
                    "Vigenere"
                ]
            },
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "UNDERLAY",
                    "TopToBottom"
                ]
            },
            {
                "op": "Register",
                "args": [
                    "(([A-Z]{8})[\\s\\S]*)",
                    true,
                    false,
                    false
                ]
            },
            {
                "op": "Find / Replace",
                "args": [
                    {
                        "option": "Regex",
                        "string": "^[\\s\\S]*$"
                    },
                    "$R0",
                    true,
                    false,
                    true,
                    false
                ]
            },
            {
                "op": "Running Key",
                "args": [
                    "Decrypt",
                    "$R1",
                    "KRYPTOS",
                    "KRYPTOS"
                ]
            },
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "$R2",
                    "TopToBottom"
                ]
            }
        ]
    },
    {
        "title": "PK6 - Quagmire PORTAL, double Columnar SMITHWORK, HANDIWORK",
        "input": "BXFIVOAJFNMLKEVEHDFJQCMVLMGNVOHCJNBOAEVRRWIJFMCWMNOOMMOSRNKYOCFRYWKHBNMYCYHDECQCFNTOXNOBKBHWBOMNHFIIZDBJRNXBABFRCBLIIBLDCINOHNLXSBKVMSBNVOFVNBFYDJEVUGMNOBMLCQACBLGNABEBCJXBEYUIBDTFOSOULYCQHBXUHSEYMCBJIIHWDCFSEVLDMMUOVFADHUMKXCGUCQIRGBCEIJFYIXOEJYHDJHMXTDIEXNDAFBMOJMYAEYBVYNFSCXBWNYOVFDXDHWFCERDEBWZUKDIJTUGCJMMVQII",
        "recipe": [
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "PORTAL",
                    "Vigenere"
                ]
            },
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "SMITHWORK",
                    "TopToBottom"
                ]
            },
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "HANDIWORK",
                    "TopToBottom"
                ]
            }
        ]
    },
    {
        "title": "PK7 - Hill ALCHEMIST, Quagmire ANNEAL",
        "input": "FNRHTKRHSEDEJMBOWBDSCSDDXLICXULMBYQXWTGUIVNDYZBEQLVHFFFIDAKDCCJKWGOOUESCYELYMRAKIUJCUSEAXUQTYKOBVYDYMRBYWOTQEESCQSMDYDQJNPSWRSUOFMFJDYXSHCXNHVJVBYMZOZOATHTEOVLOQWZITHTEAFMKGLASTBZRDMFRJPKWJOXZXPJCBOVAZEPKAEJPPSIUJODXTXERWTLTTYMRENBJGTNMLBDJMYJDDLRCXCQCHYMJMHBEOLXEUFNJKBPRSHTEYXB",
        "recipe": [
            {
                "op": "Hill Keyword",
                "args": [
                    "Decrypt",
                    "ALCHEMIST",
                    "KRYPTOS"
                ]
            },
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "ANNEAL",
                    "Vigenere"
                ]
            }
        ]
    },
    {
        "title": "PK8 - Quagmire METE + METER + METIER + MASTERY",
        "input": "COPVEJJVSVURTVIPYOTPLHGBTMAUCCPESIWIGZBWSJPKTRPUEKQFIFCLHMXTHIMHWOYIGURBOMPARCVXVKBDDVBVHDRHGCVNWWVLBMYWMWHICFIXZWBVZYCQGNOGJGUMLNPUTHQCXNWPQZOIRJZGSWVPY",
        "recipe": [
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "METE METER METIER MASTERY",
                    "Vigenere"
                ]
            }
        ]
    },
    {
        "title": "PK9 - Columnar BEAMWORK, 12 x 12 clockwise spiral, Quagmire CLEPSYDRA (method by Colin Patrick)",
        "input": "KSYAWFEYYOISZGEUFBLYATAIBYFAQBQYYVDWJKLJXMYIEPIFVHPQNHZGSUHUUDXLEHRHUMALHEGLHXSJMUXGNUIVBXGUJHZRZGUSVHMLSCTSUQXHSUMQQIFUQGKHJGUQGLHDKEWSKAMHIJXD",
        "recipe": [
            {
                "op": "Keyword Columnar",
                "args": [
                    "Decrypt",
                    "BEAMWORK",
                    "TopToBottom"
                ]
            },
            {
                "op": "Grid Route",
                "args": [
                    "Decrypt",
                    12,
                    12,
                    "Rotate270",
                    "SpiralIn"
                ]
            },
            {
                "op": "Quagmire",
                "args": [
                    "Decrypt",
                    "KRYPTOS",
                    "KRYPTOS",
                    "CLEPSYDRA",
                    "Vigenere"
                ]
            }
        ]
    }
];

export const PK_CIPHERTEXTS = {
    "pk1": "MQRALWVSJIMSXGJSVWQPHJMDINKXGIMHNKYUTXTTGJCYIABTJUMQEOFBITNBMONGVWETDLAIJPQYMZIKBQVRXZHUIJVDJLTQHIQYHEQKFTPTJYCONAFXYWQIBONAYXGWJFFIQMVXNVQYQFMWKFEJQYZFBWKXBKDQLJRELWGWDKHECRSFBKOVQJCPYDNKXYHE",
    "pk2": "HNETIOCOIOISNNENEELOWYTTLQUBDBTHTEOTRRASAHCDSEETONVRCESHRRETUPCITEWIGNIUNIGANLHJRAHMSRUINHERAEEAEAJEEEEKEEDATIIAONIXRNRHCNTLGLOIIUNSEESEGNBANTVTCSFREDIUROTNENHMRIIEROLTLSDAOOAEQIEOAPUHITHAIKHTIEUHGSLAFFSNVRSRHNNSMASTIPIAHAOEEUDESSOEONCDHAOTOOEOTSEECLADNHNTOUVSGAGTATSNEWHSATEUEETEURTRNEOGITREHMPPROBEOETOERICETGSMTEITENNSGSDRNOVTTFBTTATMLOSOPLSTARATE",
    "pk3": "HWZTRPPVHZLHRBQBQOMZBACNOTHLYGBATBTKHERQHRVZWWXCTZLRRVZCROHCIOTBVJKCALNKFJHEIMKUHJPFNVBCGQYNZMOHGBUTDPTJTDSUBOLYPLSKIEMANXMFNDBCTNRTLLVQOXUBPAXQUVDNXUMCIFOGETZWHJDIWDBWQFXAOMWBBCQXYZFZBTRIQMYOFFMVWSFLPTHFFQUINGLAMSQJOPUESPIQGZZCTJVRLQMIIRROOGBWNPQMXFQDVFTCVGNRIXQKUYYKBRTWPCDHLAWC",
    "pk4": "YOVISYUAFKUQNRJQLZTAZTMQOUKELJKCYUWIDSPSWRJRUEZNIFPUMUHQFFVBGOBEPWNTZGKVUTOVFSADUJUAYGWKQYOGNKHZVQMEWHSJGJFOBPHXKAPEXPWRJTSPSIJLCSXYTLDFBNZNPUAZNBZPKRFCUZDDZHZULZVPVWCXSIUVSCCFATGSJPNIGCJVTMUPTCGRTOFRXWCYKOMXOJKCECRUCKBDCIYJ",
    "pk5": "IJQUVJJINKWMJBNJHKZZMTVTUBFHXZJIUHOVONZNXKFUALEMYWTNNNILTRNVSXIXIQCLOSFZVZGTHQKZFJJHJMJTSEPAMKNMTGPVFWSWSBSIHOJWNFXDIJPJNOVBWWXJYUVVAFTIDZISJNCIGHXKLNFEQRDVYIXUXQIZFNXAKYXIUEVGRBMHWRFDZSMMDPMKIZNUQUJNXVZTGHCNAUVIYZCLRAVMJKAOIBOPZTJUPACSTFFLERTGBFFNCYTAVIRXXYOXHCDWHWWKAMQO",
    "pk6": "BXFIVOAJFNMLKEVEHDFJQCMVLMGNVOHCJNBOAEVRRWIJFMCWMNOOMMOSRNKYOCFRYWKHBNMYCYHDECQCFNTOXNOBKBHWBOMNHFIIZDBJRNXBABFRCBLIIBLDCINOHNLXSBKVMSBNVOFVNBFYDJEVUGMNOBMLCQACBLGNABEBCJXBEYUIBDTFOSOULYCQHBXUHSEYMCBJIIHWDCFSEVLDMMUOVFADHUMKXCGUCQIRGBCEIJFYIXOEJYHDJHMXTDIEXNDAFBMOJMYAEYBVYNFSCXBWNYOVFDXDHWFCERDEBWZUKDIJTUGCJMMVQII",
    "pk7": "FNRHTKRHSEDEJMBOWBDSCSDDXLICXULMBYQXWTGUIVNDYZBEQLVHFFFIDAKDCCJKWGOOUESCYELYMRAKIUJCUSEAXUQTYKOBVYDYMRBYWOTQEESCQSMDYDQJNPSWRSUOFMFJDYXSHCXNHVJVBYMZOZOATHTEOVLOQWZITHTEAFMKGLASTBZRDMFRJPKWJOXZXPJCBOVAZEPKAEJPPSIUJODXTXERWTLTTYMRENBJGTNMLBDJMYJDDLRCXCQCHYMJMHBEOLXEUFNJKBPRSHTEYXB",
    "pk8": "COPVEJJVSVURTVIPYOTPLHGBTMAUCCPESIWIGZBWSJPKTRPUEKQFIFCLHMXTHIMHWOYIGURBOMPARCVXVKBDDVBVHDRHGCVNWWVLBMYWMWHICFIXZWBVZYCQGNOGJGUMLNPUTHQCXNWPQZOIRJZGSWVPY",
    "pk9": "KSYAWFEYYOISZGEUFBLYATAIBYFAQBQYYVDWJKLJXMYIEPIFVHPQNHZGSUHUUDXLEHRHUMALHEGLHXSJMUXGNUIVBXGUJHZRZGUSVHMLSCTSUQXHSUMQQIFUQGKHJGUQGLHDKEWSKAMHIJXD",
    "pk10": "UBINFYJSFQXQVRLJJAJDGBXIWKDMAREZTGSHQWRXCHEPCLYSDNGYRRBTCVOZJYVLYWREJTCDOYVEYCJJVZKRMKTRPGVHRWMJSRCSHXZMJEVQKJYJJAYZKDFQBGRSWXATJMEXKFXAXKSIZXOERFESNVCGCNRHEOBCNCBUPXTJJRCIMDMRUVZWRDRRFXAPGPIGSPLILFIZSTDZYOVQGGDFUFZPUOJPJVWREUVRQIYPCEHGYUZUKWTFXELUNOKBANZFTFRMXZSXXQSBGPCWGXPFSCANSVUYLMTZIRCCCJJPBQAEPWVCDIMLOPOXQEGJKVQIVHEFAPQMVCYSQAFKCTYTPAOOJZCWIPGDPAFTINBFFHVXYEQXCEIDJJOUABBAHSWKHGMLJBXDSQEFBBDLTLJPLZPIPPTRGDRZIZPUPYJODOCSOYCZZWTKYWMBQTFMFEQZWVPQYLJTMEYKYBNOPEPUMHCFJSLFWOISWLKFFABTYFQDTEQBDELIEOZQ"
};
