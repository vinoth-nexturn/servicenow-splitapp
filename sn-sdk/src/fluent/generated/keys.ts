import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: 'aa19fc47159942709d8f3cfc7728d5bb'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'a9a5de4645c84a64aad37be9d0e728e6'
                    }
                    'split-api': {
                        table: 'sys_ws_definition'
                        id: 'ee868ad681974812bbd78993d2e93185'
                    }
                    'split-api-delete-expense': {
                        table: 'sys_ws_operation'
                        id: 'f36ead77dc62432ab80109624bab0e8b'
                    }
                    'split-api-delete-group': {
                        table: 'sys_ws_operation'
                        id: 'd57dcf35ec654276a34c6f2fc73cf4c1'
                    }
                    'split-api-delete-member': {
                        table: 'sys_ws_operation'
                        id: '0eb96c3e8d134022a7c911dbafc138b8'
                    }
                    'split-api-get-balances': {
                        table: 'sys_ws_operation'
                        id: 'bc44c652652748a5af652d1ae59678aa'
                    }
                    'split-api-get-dashboard': {
                        table: 'sys_ws_operation'
                        id: '397f6a54316e46f8a0d049b3da830399'
                    }
                    'split-api-get-expense': {
                        table: 'sys_ws_operation'
                        id: '81d04e2d9dd643cc8f61e5db0fdbb1b4'
                    }
                    'split-api-get-expenses': {
                        table: 'sys_ws_operation'
                        id: 'd694802a806344128ed1b2a2ea47f770'
                    }
                    'split-api-get-group': {
                        table: 'sys_ws_operation'
                        id: '8fa8806e21f04186a27fb87fc25f9abb'
                    }
                    'split-api-get-groups': {
                        table: 'sys_ws_operation'
                        id: 'adb9d9bc1c764620ac27524bb8dc4300'
                    }
                    'split-api-post-expenses': {
                        table: 'sys_ws_operation'
                        id: '332e3e3e11ce4cbfa0362eb63293a286'
                    }
                    'split-api-post-groups': {
                        table: 'sys_ws_operation'
                        id: '724d4496042a4cb985cc9e1af7b92cda'
                    }
                    'split-api-post-members': {
                        table: 'sys_ws_operation'
                        id: 'd99bf4c8000a417c8a1efdfac7e24b8e'
                    }
                    'split-api-post-settlements': {
                        table: 'sys_ws_operation'
                        id: 'a932c92615724461b9840660dcbe584c'
                    }
                    'split-api-put-expense': {
                        table: 'sys_ws_operation'
                        id: '08c1bc46b6c1453eba69e3eb2f00d8f3'
                    }
                    'split-si-balance-calculator': {
                        table: 'sys_script_include'
                        id: '57aec719187f4c4581c4439d496487af'
                    }
                    'split-si-expense-manager': {
                        table: 'sys_script_include'
                        id: '3e98d60a3ed34c978d183645ccf7075b'
                    }
                    'split-si-settlement-processor': {
                        table: 'sys_script_include'
                        id: 'a1aa4e378a514a218b74b396689a458e'
                    }
                    'split-si-setup-app': {
                        table: 'sys_script_include'
                        id: '54bc027d9be54049a8c088839f2fef86'
                    }
                    'split-si-split-utils': {
                        table: 'sys_script_include'
                        id: '503c6aa7068546a792ae75f322633eeb'
                    }
                    'src_server_script-includes_BalanceCalculator_server_js': {
                        table: 'sys_module'
                        id: '50d29715d4064cdd90ddc81be338fc6e'
                    }
                    'src_server_script-includes_ExpenseManager_server_js': {
                        table: 'sys_module'
                        id: '7bec7a4e2c444aec8872cb44f14ed84a'
                    }
                    'src_server_script-includes_SettlementProcessor_server_js': {
                        table: 'sys_module'
                        id: 'a073a1114b854a56addb67b60c60d4c6'
                    }
                    'src_server_script-includes_SetupApp_server_js': {
                        table: 'sys_module'
                        id: '544b6c609fb04580ac1ab1bf96a2c667'
                    }
                    'src_server_script-includes_SplitUtils_server_js': {
                        table: 'sys_module'
                        id: '2ee17faad3fe41f8b77efedf0d44a089'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '02dc16275ec74b5fa86c28522b767917'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '09bba102be53480696619caa3eefd949'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0a67a9bb5a60485fbe44292550055c59'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'settled_amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0b94cc7740e14a38ae1b08f1b3f3447e'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'group'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0e9102546bcd41bc8b7efa99a5b67e42'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '15494d67551f479fa108864d700b80fc'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'settled'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '21db69ea2fde475d89fbe15a095a2d68'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '222e667d7efc417da0665b45c7b3f493'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '231500252f994ceb8e44f38b40e36540'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '258ec626fde5478cbe3e73c3a4f12875'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '28ee98094e004fa286ec8c3aaf714a0f'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '29c05555b3fc4cf4873098e447fa31a8'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'from_user'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '2aff4115030340c0b1e2252f899c4361'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2e2bf62016164ad19bd54464d5f4fd33'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '31657b7211a246c88e064c67c82438b5'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                            value: 'other'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '329ed9fdff9c4a15a7baf604fb1bfb43'
                        key: {
                            application_file: '6cb090652cdb4ab4b5c73a15a2bf6d0f'
                            source_artifact: '4cd16c13059e46c59275dfc2308b3859'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '33cd4625bd394aef988271ee07c01eff'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'to_user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '351e86d27fb948cb91d2e15fc61a4f51'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '368b32f49a714e698665a333d7a6e91a'
                        key: {
                            name: 'x_snc_split_app_2_share'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '39669a1d9a38436499515a4cba4b4dad'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'date'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3bb5381cff5c46d08be4fc67cc1710af'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                            value: 'INR'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3e719973a9cf49f391238c4392017e58'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'created_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '44145a48b560417b9000ec8546e5a71b'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4acdd703303d495d8624f9f11fd4ba8f'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'role'
                            value: 'member'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '4b033fe296ae4b14946e9b57cdfaa353'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'role'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '4cd16c13059e46c59275dfc2308b3859'
                        key: {
                            name: 'x_snc_split_app_2_split_app.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '51b289902e1943058d74d7419383f2c9'
                        key: {
                            application_file: 'eb10be2a1f4441d5b2dfe013ee5ba578'
                            source_artifact: '4cd16c13059e46c59275dfc2308b3859'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '52a987379ff6448b86fb8132d63ac5a1'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'from_user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '53939a17889e42f9bf1965c3c3f90808'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'percentage'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '551fef568ffe40bcb2ea93a6b9f990a2'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '596e128bb6724acaa0f80341fa36557a'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'group'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5a409d5d3470494f9048ab3ca5fbe8df'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5e48dc5cd03b4b2f80010f19d6542bfa'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                            value: 'USD'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f4565cbf00a41d2913527110c5f95f6'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '64fc3e767cb7424586e115d66f92fabb'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '65135471a98847e3bdf139ceefc90fe7'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '65b9ca07e8fd4d5aa764ac128844971b'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'payment_method'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6cb090652cdb4ab4b5c73a15a2bf6d0f'
                        key: {
                            name: 'x_snc_split_app_2/split_app_main'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6cd548bec30248679ba878ce74577ac4'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'receipt_image'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6e981f85f97546c3a6813904a1f72dca'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '6f372f500d93471e83709a3ac1094b9c'
                        key: {
                            name: 'x_snc_split_app_2_group'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '72c93fcb7e094acdb6a925ebc4d6faa5'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '73b778c8ed7f4064bbdce7d60cd66c93'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'created_by'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '758ddaca3f1147d48ccbd958d77c8239'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                            value: 'food_drink'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '776d2af8bd1c4f30afe2904e180b4473'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'expense'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7c63fcc886a44603a8b7ed94e9f5aa63'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7d82cc0a3c0745ccaab4142e7e9c15a9'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                            value: 'utilities'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8138c7779556418698787d0748b114e0'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'settled'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '81ce1da400ef42c58389ca5acc9a1c77'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                            value: 'travel'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '87230bc670044a6ebd66de56d465e7d8'
                        key: {
                            name: 'x_snc_split_app_2_share'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8c393e2ba86a4eb88f2f01bc93deb46e'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                            value: 'exact'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '923f5ec8115a40679d412a6f59c2e64b'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'payer'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '945511d240844684a147e91e5827148e'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'group'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '94e3e76a62fc496abb6a1642501d2a19'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '9f8ebee968cb40b1a0253d2f97d7588f'
                        key: {
                            endpoint: 'x_snc_split_app_2_split_app.do'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9f9a8f66af19471896b8d53812b3e374'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a971271fa30146319d707ddf92def866'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aacb36e9e1804041938f059a688d6492'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ab6bc936d59644b18d966d397d14e228'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                            value: 'equal'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ab79818736054339bdd5dab51273f205'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'settled_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ae9b9418e2774982903a794288e5189e'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'percentage'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'afa2a49eddbe47bf86d846fac3956e68'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'b0ed0645cd20423487e8ec584e276735'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b4b4a0bb11c8457eaa164d99fb2be915'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b53bf31b00a64375a7efa2bdb8ba624e'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b600bc5081da4ef38c9e98a936da1f69'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'payer'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b6ce6dc0326049518bff60ea54143404'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'group'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b9527965252c42158de0ff7b4d98200e'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bbb176115d3e43dd860e979dcf026160'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                            value: 'percentage'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc8f341240584044ba35823b6c85be0e'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c309ddcf2be1447bb3223a33ef1bb53c'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'group'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c3756768dad04dc3a91cd9f7670df35c'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'c40d7d1df8fc471e874c9cee3e07f0a5'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cbbfc865a5ec4887854fd7b76afc953f'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cbc30fa110b04a4e89fe977bad1ae8f1'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                            value: 'GBP'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cc592d23cee144ebb334eb6f3aa90534'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cd0d2b6f766642d6a08ffa9c92cc7cc8'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd576a7cc99ae42b4a3c93e20917859da'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'group'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd5964371af68427090fc2fa5fd686d8a'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'payment_method'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd6bef1fdd0714332b62306e9c3b418ba'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd74757d120af47c7b8c20299417f8ef2'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'shares'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd804302f558f4b6787ceb940597bab7f'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                            value: 'shares'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd9a10e3d383245c19b86275f70a8d8f0'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'role'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'da300b4bf50b4d3080ad8e84c5766a43'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                            value: 'entertainment'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dcf9b65ab2394d47baf83ab34ac6712e'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'receipt_image'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ddce6e7ff60747518e0c850b3d84fea8'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'df2168dba2b544c2a88226c51a3fe826'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'df5963b976a74a9dbe39c7d04aea4af2'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'split_type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dfcd6ac3b1234b10b8493ab8e4e66d28'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'e318d787905f40058bd34a6abdb2b575'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e49029f1fc9e4c2b98e6151ff3058095'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                            value: 'EUR'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e4b262faff2b4b33bdcafe355a068540'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e5401fda332b441a8dd8e1acb2562a3a'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'shares'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'e7d786fb6b71433fb7f93b249b473d78'
                        key: {
                            name: 'x_snc_split_app_2_group'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'eb10be2a1f4441d5b2dfe013ee5ba578'
                        key: {
                            name: 'x_snc_split_app_2/split_app_main.js.map'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'ecb33d53cb2c43d090b5dd3d1d05b09d'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f0eb78a63d664729aecbdd4936bbf26a'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f1c8b6dc37504128bbb0e410370154a1'
                        key: {
                            name: 'x_snc_split_app_2_share'
                            element: 'expense'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f3cb425cf54f460296d95d3bf045942c'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'role'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f43663fea5ae4f0eaf4bf4781288ac94'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f606cfaac70e492ea3035e8e977636ca'
                        key: {
                            name: 'x_snc_split_app_2_membership'
                            element: 'role'
                            value: 'admin'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'f74e5a7629e840fe8491b3db37e9c320'
                        key: {
                            application_file: '9f8ebee968cb40b1a0253d2f97d7588f'
                            source_artifact: '4cd16c13059e46c59275dfc2308b3859'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f8bb1394616c4c6b885e290afffe9a77'
                        key: {
                            name: 'x_snc_split_app_2_expense'
                            element: 'date'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fa4d95df4c0e4868921b682f431333c7'
                        key: {
                            name: 'x_snc_split_app_2_group'
                            element: 'base_currency'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fda552f123bd460b98c30031995754e6'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'to_user'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fe4fe04a3c4e4793ba7f62a52ef8c943'
                        key: {
                            name: 'x_snc_split_app_2_settlement'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
