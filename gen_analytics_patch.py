path = r'c:\Users\nerdy\CascadeProjects\TestBB\frontend\src\pages\AnalyticsPage.jsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = """          {/* Pin Chart */}
          <button
            onClick={() => {
              pinChart({
                symbols: selectedSymbols,
                period,
                chartType,
                normalize,
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50 transition-all"
          >
            <Pin className="w-3.5 h-3.5" />
            Pin Chart
          </button>

          {/* Reset */}"""

new = """          {/* Load from List */}
          <div ref={listPickerRef} className="relative">
            <button
              onClick={openListPicker}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                showListPicker
                  ? 'bg-primary-600/20 border-primary-500/50 text-primary-300'
                  : 'border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Load List
            </button>
            {showListPicker && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-surface-700 border border-surface-600 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-surface-600">
                  <span className="text-xs font-semibold text-gray-300">Load from My Lists</span>
                </div>
                {userLists.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {userLists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => loadFromList(list)}
                        disabled={list.items.length === 0}
                        className={`w-full text-left px-3 py-2.5 hover:bg-surface-600 transition-colors flex items-center justify-between ${
                          list.items.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="text-sm text-white truncate">{list.name}</span>
                        <span className="text-[10px] text-gray-500 ml-2 shrink-0">{list.items.length} items</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-xs text-gray-500">No lists yet.</p>
                    <p className="text-[10px] text-gray-600 mt-1">Create lists from the Lists page.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pin Chart */}
          <button
            onClick={() => {
              pinChart({
                symbols: selectedSymbols,
                period,
                chartType,
                normalize,
              })
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 text-gray-400 hover:text-primary-300 hover:border-primary-500/50 transition-all"
          >
            <Pin className="w-3.5 h-3.5" />
            Pin Chart
          </button>

          {/* Reset */}"""

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('AnalyticsPage.jsx patched successfully')
else:
    print('ERROR: Could not find the target text to patch')
    # Debug
    lines = content.split('\n')
    for i, line in enumerate(lines[383:400], start=384):
        print(f'{i}: {line}')
